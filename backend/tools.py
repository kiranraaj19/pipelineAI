# Import things that are needed generically
import json
from typing import Annotated
from pydantic import BaseModel, Field
from langchain.tools import BaseTool, StructuredTool, tool
from dotenv import load_dotenv
import base64
import requests
import os
from openai import AzureOpenAI
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage

load_dotenv()

client = AzureChatOpenAI(
    azure_deployment="gpt-4o",
    temperature=0
)

def get_filtered_pipelines_and_branches(prompt, pipelines, branches):
    """Uses Azure OpenAI to filter pipelines and branches based on the user's prompt."""
    try:

        prompt_text = f"""
        User Prompt: {prompt}
        Given the following pipelines and branches:
        Pipelines: {pipelines}
        Branches: {branches}
        Return only the relevant pipelines and branches related to the user's prompt.
        """
        
        response = client.invoke([SystemMessage(content=prompt_text)])
        
        return response
    except Exception as e:
        return f"Error filtering pipelines and branches: {e}"

@tool
def get_repo_pipeline_info(prompt: Annotated[str, 'User prompt for filtering pipelines and branches']):
    """Fetches all repositories, branches, pipelines, and pipeline branches, filtered according to the user's prompt."""
    try:
        load_dotenv()
        organization = os.getenv("AZURE_ORG")
        project = os.getenv("AZURE_PROJECT")
        pat = os.getenv("PAT_TOKEN")

        url_repos = f'https://dev.azure.com/{organization}/{project}/_apis/git/repositories?api-version=7.1'
        url_pipelines = f'https://dev.azure.com/{organization}/{project}/_apis/pipelines?api-version=7.1-preview.1'

        headers = {
            'Authorization': f'Basic {base64.b64encode(f":{pat}".encode()).decode()}'
        }

        response_repos = requests.get(url_repos, headers=headers)
        response_repos.raise_for_status()
        repositories = response_repos.json()['value']

        response_pipelines = requests.get(url_pipelines, headers=headers)
        response_pipelines.raise_for_status()

        # Extract id and name for each pipeline
        pipelines = [{"id": pipeline["id"], "name": pipeline["name"]} for pipeline in response_pipelines.json().get("value", [])]

        all_branches = {}
        for repo in repositories:
            repo_name = repo['name']
            repo_id = repo['id']
            url_branches = f'https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repo_id}/refs?filter=heads/&api-version=7.1'
            response_branches = requests.get(url_branches, headers=headers)
            response_branches.raise_for_status()
            all_branches[repo_name] = [ref['name'].replace('refs/heads/', '') for ref in response_branches.json()['value']]

        
        filtered_output = get_filtered_pipelines_and_branches(prompt, pipelines, all_branches)
        
        return filtered_output
    except requests.exceptions.RequestException as e:
        return f"Error fetching data: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


@tool
def trigger_pipeline(
    definition_id: Annotated[str, 'ID of the Azure pipeline to trigger'],
    branch_name: Annotated[str, 'Name of the branch to run the pipeline on, e.g., "main" or "feature-branch"']
):
    """Triggers the specified Azure DevOps pipeline on the given branch."""

    # Load environment variables
    load_dotenv()
    organization = os.getenv("AZURE_ORG")
    project = os.getenv("AZURE_PROJECT")
    pat_token = os.getenv("PAT_TOKEN")

    # Construct the API URL
    url = f"https://dev.azure.com/{organization}/{project}/_apis/pipelines/{definition_id}/runs?api-version=7.1-preview.1"

    # Set up headers with PAT authentication
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64.b64encode(f':{pat_token}'.encode()).decode()
    }

    # Prepare the request payload
    body = {
    "resources": {
        "repositories": {
            "self": {
                "refName": f"refs/heads/{branch_name}"  
            }
        }
    },
    "definition": {"id": int(definition_id)}
    }

    try:
        # Send the POST request to trigger the pipeline
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return f"Successfully triggered pipeline {definition_id} on branch '{branch_name}'."
    except requests.exceptions.RequestException as e:
        return f"Failed to trigger pipeline {definition_id} on branch '{branch_name}': {e}"


# @tool
# def list_pipelines():
#     """Fetch Pipelines along with branches."""
#     try:
#         load_dotenv()

#         organization = os.getenv("AZURE_ORG")
#         project = os.getenv("AZURE_PROJECT")
#         pat_token = os.getenv("PAT_TOKEN")
#         url = f"https://dev.azure.com/{organization}/{project}/_apis/build/definitions?api-version=6.0"
    
#         headers = {
#             'Content-Type': 'application/json',
#             'Authorization': 'Basic ' + base64.b64encode(f':{pat_token}'.encode()).decode()
#         }
    
#         response = requests.get(url, headers=headers)
#         if response.status_code == 200:
#             pipelines = response.json().get("value", [])
#             pipelines = [{"id": pipeline["id"], "name": pipeline["name"], "type": "text"} for pipeline in pipelines]
#             if not pipelines:
#                 return "No pipelines found."
#             else:
#                 return pipelines
#         else:
#             return "Failed to fetch pipelines"
#     except Exception as e:
#         print("Exception occured: ",e)