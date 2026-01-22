import Link from "next/link"
import { ArrowRight, Zap, Shield, Users, BarChart, CheckCircle2, Terminal } from "lucide-react"
import MatrixBackground from "@/components/matrix-background"

// Animated chat component
const AnimatedChat = () => {
  return (
    <div className="relative w-full h-full bg-secondary/5 rounded-2xl overflow-hidden shadow-xl border border-primary/20">
      <div className="absolute top-0 left-0 w-full h-12 bg-secondary/95 flex items-center px-4 rounded-t-2xl">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-white text-sm font-medium mx-auto">Pipeline.run Chat</div>
      </div>

      <div className="pt-16 pb-4 px-4 h-full overflow-hidden">
        {/* First message */}
        <div className="flex items-start mb-6 opacity-0 animate-[fadeIn_0.5s_0.2s_forwards]">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-3 rounded-tl-none max-w-[80%]">
            <p className="text-foreground text-sm">I need to deploy the latest changes to production.</p>
          </div>
        </div>

        {/* Second message with typing animation */}
        <div className="flex items-start mb-6 opacity-0 animate-[fadeIn_0.5s_0.8s_forwards]">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div className="bg-primary/20 backdrop-blur-sm rounded-lg p-3 rounded-tl-none max-w-[80%]">
            <p className="text-foreground text-sm typing-effect">
              I can help with that! Which pipeline would you like to run?
            </p>
          </div>
        </div>

        {/* Third message */}
        <div className="flex items-start mb-6 opacity-0 animate-[fadeIn_0.5s_2.5s_forwards]">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-3 rounded-tl-none max-w-[80%]">
            <p className="text-foreground text-sm">Let's run the frontend-deploy pipeline on the main branch.</p>
          </div>
        </div>

        {/* Fourth message */}
        <div className="flex items-start opacity-0 animate-[fadeIn_0.5s_3.5s_forwards]">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div className="bg-primary/20 backdrop-blur-sm rounded-lg p-3 rounded-tl-none max-w-[80%]">
            <p className="text-foreground text-sm">
              <span className="block mb-2">✅ Pipeline started successfully!</span>
              <span className="block text-xs text-muted-foreground">Pipeline ID: #28491</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Matrix Background */}
      <MatrixBackground />

      <header className="border-b border-border/40 bg-background/70 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
              <Terminal className="text-white h-5 w-5" />
            </div>
            <span className="text-secondary dark:text-white font-bold text-xl">
              Pipeline<span className="text-primary">.run</span>
            </span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-muted-foreground hover:text-primary transition-colors">
              Benefits
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link
              href="/chat"
              className="bg-primary/10 text-primary px-4 py-1 rounded-full hover:bg-primary/20 transition-colors"
            >
              Launch Chat
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow relative z-0">
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 bg-background/50 backdrop-blur-sm p-8 rounded-2xl">
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                  <span className="block">Run Pipelines</span>
                  <span className="gradient-text">in Seconds</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Streamline your workflow with our intelligent Pipeline.run. Communicate naturally and trigger
                  pipelines using Agentic AI, reducing errors and improving collaboration across your team.
                </p>
                <Link
                  href="/chat"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-lg">Launch Chat Interface</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="relative h-[400px] md:h-[500px]">
                <AnimatedChat />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold gradient-text inline-block mb-4">Key Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful tools to transform how you manage and execute your pipelines
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-modern p-8 group bg-background/70">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Natural Language Interaction
                </h3>
                <p className="text-muted-foreground">
                  Communicate with your pipelines using everyday language, no complex commands required.
                </p>
              </div>

              <div className="card-modern p-8 group bg-background/70">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Terminal className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Automated Pipeline Execution
                </h3>
                <p className="text-muted-foreground">
                  Trigger and monitor complex pipelines with simple chat commands and interactive options.
                </p>
              </div>

              <div className="card-modern p-8 group bg-background/70">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Intelligent Decision Support
                </h3>
                <p className="text-muted-foreground">
                  Get recommendations and insights to make better decisions about your pipeline operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="py-20 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold gradient-text inline-block mb-4">Benefits</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how Pipeline.run transforms your development workflow
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start group bg-background/70 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      Increased Efficiency
                    </h3>
                    <p className="text-muted-foreground">
                      Reduce the time spent on pipeline management by up to 60% with automated workflows and natural
                      language commands.
                    </p>
                  </div>
                </div>

                <div className="flex items-start group bg-background/70 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      Reduced Errors
                    </h3>
                    <p className="text-muted-foreground">
                      Minimize human error with AI-guided pipeline execution and validation checks at each step of the
                      process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-start group bg-background/70 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      Improved Collaboration
                    </h3>
                    <p className="text-muted-foreground">
                      Enable seamless communication between team members with shared pipeline contexts and transparent
                      execution history.
                    </p>
                  </div>
                </div>

                <div className="flex items-start group bg-background/70 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      Enhanced Productivity
                    </h3>
                    <p className="text-muted-foreground">
                      Focus on high-value tasks while Pipeline.run handles routine pipeline operations and monitoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-secondary/90 text-white relative overflow-hidden backdrop-blur-sm">
          <div className="container mx-auto px-4 max-w-6xl text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your pipeline management?</h2>
            <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto">
              Start using Pipeline.run today and experience the future of workflow automation.
            </p>
            <Link
              href="/chat"
              className="group inline-flex items-center justify-center px-10 py-5 bg-primary text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Launch Chat Interface</span>
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-background/70 py-12 border-t border-border/40 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2 shadow-md shadow-primary/20">
                <Terminal className="text-white h-4 w-4" />
              </div>
              <span className="text-secondary dark:text-white font-bold">
                Pipeline<span className="text-primary">.run</span>
              </span>
            </div>
            <div className="text-muted-foreground text-sm">© {new Date().getFullYear()} All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

