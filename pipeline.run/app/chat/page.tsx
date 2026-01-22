"use client"

import React, { Fragment } from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowLeft, Send, Loader2, Terminal } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { renderMarkdown } from "@/lib/markdown"

// Message types
type MessageType = "user" | "agent" | "system" | "options"

interface Message {
  id: string
  type: MessageType
  content: string
  speaker?: string
  options?: Option[]
  timestamp: Date
  tablePlaceholder?: string
}

interface Option {
  id: string
  label: string
  checked: boolean
}

interface TableRow {
  cells: string[]
  selected: boolean
}

interface TableData {
  headers: string[]
  rows: TableRow[]
}

// Helper function to get initials from speaker name
function getInitials(speaker: string): string {
  return (
    speaker
      .split("_")
      .map((word) => word[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "PR"
  )
}

// Helper function to get background color based on speaker
function getSpeakerColor(speaker: string): string {
  switch (speaker?.toLowerCase()) {
    case "assistant":
      return "bg-primary"
    case "ado_proxy_agent":
      return "bg-primary"
    case "human":
      return "bg-muted"
    default:
      return "bg-primary"
  }
}

// Helper function to filter out unwanted messages
function shouldShowMessage(speaker?: string): boolean {
  if (!speaker) return true
  const hiddenSpeakers = ["orchestrator", "tool_call"]
  return !hiddenSpeakers.includes(speaker.toLowerCase())
}

// Helper function to detect and parse tables in markdown content
function detectTables(content: string): {
  hasTable: boolean;
  tableData: TableData | null;
  contentWithPlaceholder: string;
  tablePlaceholder: string;
} {
  // Look for tables wrapped in <selectable_table> tags
  const selectableTableRegex = /<selectable_table>([\s\S]*?)<\/selectable_table>/g
  const selectableMatch = content.match(selectableTableRegex)
  
  if (!selectableMatch) {
    return { 
      hasTable: false, 
      tableData: null, 
      contentWithPlaceholder: content,
      tablePlaceholder: ''
    }
  }
  
  // Extract the table content from within the tags
  const selectableTableContent = selectableMatch[0]
  const tableContentWithoutTags = selectableTableContent
    .replace('<selectable_table>', '')
    .replace('</selectable_table>', '')
    .trim()
  
  // Now look for the markdown table within the selectable_table tags
  const tableRegex = /\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n)+/g
  const tableMatch = tableContentWithoutTags.match(tableRegex)
  
  if (!tableMatch) {
    return { 
      hasTable: false, 
      tableData: null, 
      contentWithPlaceholder: content,
      tablePlaceholder: ''
    }
  }
  
  const tableContent = tableMatch[0]
  const tablePlaceholder = `__TABLE_PLACEHOLDER_${Date.now()}__`
  
  // Replace the entire <selectable_table> section with a unique placeholder
  const contentWithPlaceholder = content.replace(selectableTableRegex, tablePlaceholder)
  
  // Parse table rows and headers
  const lines = tableContent.trim().split('\n')
  
  if (lines.length < 3) {
    return { 
      hasTable: false, 
      tableData: null, 
      contentWithPlaceholder: content,
      tablePlaceholder: ''
    }
  }
  
  // Parse headers
  const headerLine = lines[0]
  const headers = headerLine
    .split('|')
    .filter(cell => cell.trim() !== '')
    .map(cell => cell.trim())
  
  // Parse rows
  const rows: TableRow[] = []
  for (let i = 2; i < lines.length; i++) {
    const rowLine = lines[i]
    const cells = rowLine
      .split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim())
    
    if (cells.length > 0) {
      rows.push({ cells, selected: false })
    }
  }
  
  return {
    hasTable: true,
    tableData: { headers, rows },
    contentWithPlaceholder,
    tablePlaceholder
  }
}

// Function to format the selected row into a string
function formatSelectedRow(headers: string[], cells: string[]): string {
  if (headers.length !== cells.length) {
    return `Use selected record`
  }

  const pairs = headers.map((header, index) => `${header}: ${cells[index]}`)
  return `Use ${pairs.join(" and ")}`
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "agent",
      content: "Hello! I'm your Pipeline.run assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [tableSelections, setTableSelections] = useState<Record<string, TableData>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ws = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update the message adding function to include speaker - MOVED INSIDE COMPONENT
  const addMessage = useCallback((content: string, speaker?: string) => {
    const messageId = Date.now().toString()

    // Check if the message contains a selectable table
    const { hasTable, tableData, contentWithPlaceholder, tablePlaceholder } = detectTables(content)

    if (hasTable && tableData) {
      // Store the table data for this message
      setTableSelections((prev) => ({
        ...prev,
        [messageId]: tableData,
      }))
    }

    // Use the content with the placeholder in the message
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        type: speaker === "human" ? "user" : "agent",
        content: hasTable ? contentWithPlaceholder : content,
        speaker,
        timestamp: new Date(),
        tablePlaceholder: hasTable ? tablePlaceholder : undefined
      },
    ])
  }, [])

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      setIsConnecting(true)

      const socket = new WebSocket("ws://localhost:8000/ws")

      socket.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setIsConnecting(false)

        // Add connection message as a system message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "system",
            content: "Connected to Pipeline.run",
            timestamp: new Date(),
          },
        ])
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received message:", data)

          if (data.speaker && data.content) {
            // If the speaker is human, enable the input
            if (data.speaker === "human") {
              setIsWaitingForResponse(false)
            }

            // Only process messages from speakers we want to show
            if (shouldShowMessage(data.speaker)) {
              // Check if content is an array (for interrupt messages) or a string/object
              if (Array.isArray(data.content)) {
                const lastMessage = data.content[data.content.length - 1]
                const messageContent = lastMessage.content || ""
                addMessage(messageContent, data.speaker)
              } else {
                const messageContent = typeof data.content === "string" ? data.content : data.content.content || ""
                addMessage(messageContent, data.speaker)
              }
            }
          }
        } catch (error) {
          console.error("Error parsing message:", error)
          addMessage(event.data, "Assistant")
        }
      }

      socket.onerror = (error) => {
        console.error("WebSocket error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "system",
            content: "Error connecting to Pipeline.run. Please try again later.",
            timestamp: new Date(),
          },
        ])
        setIsConnected(false)
        setIsConnecting(false)
        setIsWaitingForResponse(false)
      }

      socket.onclose = (event) => {
        console.log("WebSocket disconnected", event)
        setIsConnected(false)
        setIsWaitingForResponse(false)

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "system",
            content: "Disconnected from Pipeline.run. Attempting to reconnect...",
            timestamp: new Date(),
          },
        ])

        // Try to reconnect after a delay, but stop after 5 attempts
        let reconnectAttempts = 0
        const maxReconnectAttempts = 5

        const attemptReconnect = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            setTimeout(connectWebSocket, 3000)
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: "system",
                content: "Could not reconnect to Pipeline.run. Please refresh the page to try again.",
                timestamp: new Date(),
              },
            ])
            setIsConnecting(false)
          }
        }

        attemptReconnect()
      }

      ws.current = socket

      return () => {
        socket.close()
      }
    }

    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [addMessage])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Focus input when page loads
  useEffect(() => {
    if (!isConnecting && isConnected && !isWaitingForResponse) {
      inputRef.current?.focus()
    }
  }, [isConnecting, isConnected, isWaitingForResponse])

  // Add a new agent message
  const addAgentMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "agent",
        content: text,
        timestamp: new Date(),
      },
    ])
  }

  // Add a message with options for user selection
  const addOptionsMessage = (options: { id: string; label: string }[], message: string) => {
    const optionsWithState = options.map((option) => ({
      ...option,
      checked: false,
    }))

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "options",
        content: message || "Please select from the following options:",
        options: optionsWithState,
        timestamp: new Date(),
      },
    ])

    setIsWaitingForResponse(false)
  }

  // Handle sending a message
  const sendMessage = () => {
    if (!input.trim() && Object.keys(selectedOptions).length === 0) return

    // If we're sending a message with text
    if (input.trim()) {
      // Add user message to UI first
      const userMessage = {
        id: Date.now().toString(),
        type: "user",
        content: input,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      // Set waiting for response
      setIsWaitingForResponse(true)

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Send the raw text message as expected by the FastAPI backend
        ws.current.send(input)
      }

      setInput("")
    }
    // If we're sending selected options
    else if (Object.keys(selectedOptions).length > 0) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Convert selected options to a text format the backend can understand
        const optionsText = JSON.stringify({
          type: "options",
          selections: selectedOptions,
        })

        ws.current.send(optionsText)
        setIsWaitingForResponse(true)
        setSelectedOptions({})
      }
    }
  }

  // Handle option selection
  const handleOptionChange = (messageId: string, optionId: string, checked: boolean) => {
    // Update the UI state for the checkbox
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === messageId && message.options) {
          return {
            ...message,
            options: message.options.map((option) => (option.id === optionId ? { ...option, checked } : option)),
          }
        }
        return message
      }),
    )

    // Track selected options for submission
    setSelectedOptions((prev) => {
      const newSelectedOptions = { ...prev }

      if (!newSelectedOptions[messageId]) {
        newSelectedOptions[messageId] = []
      }

      if (checked) {
        newSelectedOptions[messageId] = [...newSelectedOptions[messageId], optionId]
      } else {
        newSelectedOptions[messageId] = newSelectedOptions[messageId].filter((id) => id !== optionId)
      }

      return newSelectedOptions
    })
  }

  // Handle table row selection
  const handleTableRowSelect = (messageId: string, rowIndex: number) => {
    // Get the current table data
    const tableData = tableSelections[messageId]
    if (!tableData) return

    // Update the selected state for this row (radio button style - only one can be selected)
    const updatedRows = tableData.rows.map((row, index) => ({
      ...row,
      selected: index === rowIndex,
    }))

    // Update the table selections state
    setTableSelections((prev) => ({
      ...prev,
      [messageId]: {
        ...tableData,
        rows: updatedRows,
      },
    }))

    // Get the selected row data
    const selectedRow = updatedRows[rowIndex]

    // Format the selection text and set it as input
    const selectionText = formatSelectedRow(tableData.headers, selectedRow.cells)
    setInput(selectionText)

    // Focus the input field
    inputRef.current?.focus()
  }

  // Handle submitting options
  const submitOptions = (messageId: string) => {
    const selectedForMessage = selectedOptions[messageId] || []

    if (selectedForMessage.length === 0) return

    // Create a user message showing what was selected
    const optionsMessage = messages.find((m) => m.id === messageId)
    const selectedLabels = optionsMessage?.options
      ?.filter((option) => selectedForMessage.includes(option.id))
      .map((option) => option.label)
      .join(", ")

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `Selected: ${selectedLabels}`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])

    // Send the selections to the backend
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "options",
          messageId,
          selections: selectedForMessage,
        }),
      )

      setIsWaitingForResponse(true)
    }

    // Clear the selections for this message
    setSelectedOptions((prev) => {
      const newSelectedOptions = { ...prev }
      delete newSelectedOptions[messageId]
      return newSelectedOptions
    })
  }

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Render a table component
  const renderTable = (messageId: string, tableData: TableData) => {
    return (
      <div className="overflow-x-auto my-4 rounded-lg border border-secondary/10 dark:border-white/10 shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-secondary/5 dark:bg-white/5">
            <tr>
              {tableData.headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium">
                  {header}
                </th>
              ))}
              <th className="w-16 px-2 py-2 text-center">Select</th>
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-t border-secondary/10 dark:border-white/10 hover:bg-secondary/5 dark:hover:bg-white/5 cursor-pointer transition-colors",
                  row.selected && "bg-primary/5 dark:bg-primary/10",
                )}
                onClick={() => handleTableRowSelect(messageId, rowIndex)}
              >
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
                <td className="px-2 py-3 text-center">
                  <div className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-primary">
                    {row.selected && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Render message content with table in the correct position
  const renderMessageContent = (message: Message) => {
    if (!message.tablePlaceholder || !tableSelections[message.id]) {
      // If there's no table placeholder or no table data, just render the content normally
      return <div dangerouslySetInnerHTML={renderMarkdown(message.content)} />
    }

    // Split the content at the table placeholder
    const parts = message.content.split(message.tablePlaceholder)
    
    return (
      <>
        {parts.map((part, index) => (
          <Fragment key={index}>
            {part && <div dangerouslySetInnerHTML={renderMarkdown(part)} />}
            {index < parts.length - 1 && tableSelections[message.id] && (
              renderTable(message.id, tableSelections[message.id])
            )}
          </Fragment>
        ))}
      </>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-secondary/5 border-b border-border/40 py-4 px-4 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center text-primary hover:text-primary/90 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2 shadow-md shadow-primary/20">
              <Terminal className="text-white h-4 w-4" />
            </div>
            <span className="text-secondary dark:text-white font-bold">
              Pipeline<span className="text-primary">.run</span>
            </span>
          </div>
          <div className="w-24">{/* Spacer to balance the header */}</div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col w-full">
        {isConnecting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-xl font-medium text-secondary dark:text-white mb-2">Connecting to Pipeline.run</p>
              <p className="text-muted-foreground">Please wait while we establish a secure connection...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="container mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("w-full", message.type === "system" && "opacity-75 text-center text-sm")}
                  >
                    {message.type === "user" && (
                      <div className="flex items-start justify-end mb-6">
                        <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-sm rounded-2xl p-4 rounded-tr-none max-w-3xl shadow-lg border border-primary/20">
                          <div className="text-foreground">
                            <div
                              className="prose dark:prose-invert"
                              dangerouslySetInnerHTML={renderMarkdown(message.content)}
                            />
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                          <span className="text-secondary dark:text-white font-bold text-sm">U</span>
                        </div>
                      </div>
                    )}

                    {message.type === "agent" && (
                      <div className="flex items-start mb-6">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                            getSpeakerColor(message.speaker || "Assistant"),
                          )}
                        >
                          <span className="text-white font-bold text-sm">
                            {getInitials(message.speaker || "Assistant")}
                          </span>
                        </div>
                        <div className="bg-secondary/5 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 rounded-tl-none max-w-3xl shadow-lg border border-secondary/10 dark:border-white/10">
                          <div className="text-foreground prose dark:prose-invert">
                            {renderMessageContent(message)}
                          </div>
                        </div>
                      </div>
                    )}

                    {message.type === "system" && (
                      <div className="text-muted-foreground text-center py-3 bg-secondary/5 rounded-full max-w-md mx-auto mb-4">
                        {message.content}
                      </div>
                    )}

                    {message.type === "options" && (
                      <div className="flex items-start mb-6">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                            getSpeakerColor(message.speaker || "Assistant"),
                          )}
                        >
                          <span className="text-white font-bold text-sm">
                            {getInitials(message.speaker || "Assistant")}
                          </span>
                        </div>
                        <div className="bg-secondary/5 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 rounded-tl-none max-w-3xl shadow-lg border border-secondary/10 dark:border-white/10">
                          <p className="text-foreground mb-4">{message.content}</p>

                          <div className="space-y-3 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-secondary/10 dark:border-white/10">
                            {message.options?.map((option) => (
                              <div key={option.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`option-${message.id}-${option.id}`}
                                  checked={option.checked}
                                  onCheckedChange={(checked) =>
                                    handleOptionChange(message.id, option.id, checked === true)
                                  }
                                  className="border-primary text-primary"
                                />
                                <label
                                  htmlFor={`option-${message.id}-${option.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>

                          <Button
                            className="mt-4 bg-primary hover:bg-primary/90 text-white"
                            size="sm"
                            onClick={() => submitOptions(message.id)}
                            disabled={!selectedOptions[message.id] || selectedOptions[message.id].length === 0}
                          >
                            Submit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isWaitingForResponse && (
                  <div className="w-full">
                    <div className="flex items-start mb-6">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                          getSpeakerColor("Assistant"),
                        )}
                      >
                        <span className="text-white font-bold text-sm">PR</span>
                      </div>
                      <div className="bg-secondary/5 dark:bg-secondary/20 rounded-2xl p-4 rounded-tl-none">
                        <div className="flex items-center space-x-2">
                          <div
                            className="h-2 w-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "600ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-border/40 bg-secondary/5 backdrop-blur-md">
              <div className="container mx-auto p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendMessage()
                  }}
                  className="flex items-center space-x-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={!isConnected || isWaitingForResponse}
                    className="flex-1 border-border/40 focus:ring-primary focus:border-primary bg-white/50 dark:bg-black/20 rounded-full py-6"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      !isConnected ||
                      isWaitingForResponse ||
                      (!input.trim() && Object.keys(selectedOptions).length === 0)
                    }
                    className="bg-primary hover:bg-primary/90 text-white rounded-full h-12 w-12 shadow-md shadow-primary/20"
                  >
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

