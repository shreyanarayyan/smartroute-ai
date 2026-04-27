import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, User, Bot, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const scrollViewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to backend proxy:", userMessage);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      console.log("Backend Proxy Response Data:", data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chat frontend error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: `Connection error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[550px] flex flex-col shadow-2xl border-border bg-card animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-primary text-primary-foreground">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1 bg-primary-foreground/20 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold leading-none">SmartRoute AI Assistant</p>
                <p className="text-[10px] font-normal opacity-70 mt-1">Delivery Optimization Expert</p>
              </div>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-primary-foreground/10 text-primary-foreground">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden bg-background">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[380px] text-center text-muted-foreground px-6">
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-primary/40" />
                    </div>
                    <p className="font-semibold text-foreground">How can I help you today?</p>
                    <p className="text-sm mt-1">I can help with route planning, fuel efficiency, and traffic management.</p>
                    <div className="grid grid-cols-1 gap-2 w-full mt-6">
                      {[
                        "How can I save fuel on long routes?",
                        "Best way to sequence 5 stops?",
                        "Tips for heavy traffic delivery?"
                      ].map(tip => (
                        <button 
                          key={tip}
                          onClick={() => setInput(tip)}
                          className="text-xs p-2 rounded-lg border bg-secondary/30 hover:bg-secondary text-left transition-colors"
                        >
                          "{tip}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`mt-1 p-1 rounded-full shrink-0 h-6 w-6 flex items-center justify-center ${
                        m.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted text-foreground rounded-tl-none border border-border/50'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[85%]">
                      <div className="mt-1 p-1 rounded-full bg-muted text-muted-foreground shrink-0 h-6 w-6 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-3 rounded-2xl bg-muted text-muted-foreground rounded-tl-none border border-border/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t gap-2 bg-background">
            <Input 
              placeholder="Type your message..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-card border-border"
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()} className="shrink-0 bg-primary shadow-soft hover:scale-105 active:scale-95 transition-all">
              <Send className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {!isOpen && (
        <Button 
          size="lg" 
          className="h-16 w-16 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all bg-primary flex items-center justify-center p-0" 
          onClick={() => setIsOpen(true)}
        >
          <div className="relative">
            <MessageSquare className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-primary animate-pulse" />
          </div>
        </Button>
      )}
    </div>
  );
};

export default ChatAssistant;
