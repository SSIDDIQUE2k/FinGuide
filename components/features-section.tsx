import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Zap, BookOpen, Shield, Target, Cpu } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "Intelligent Search",
      description:
        "Advanced hybrid retrieval combining vector similarity, keyword matching, and financial term recognition for precise results.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Optimized processing with FAISS indexing and efficient chunking strategies for instant responses to your queries.",
    },
    {
      icon: BookOpen,
      title: "Cited Answers",
      description:
        "Every answer includes precise citations with document names and page numbers for complete transparency and verification.",
    },
    {
      icon: Shield,
      title: "Secure Processing",
      description:
        "Your financial documents are processed securely with enterprise-grade encryption and privacy protection.",
    },
    {
      icon: Target,
      title: "Financial Focus",
      description:
        "Specialized for financial documents with built-in recognition of financial terms, concepts, and industry-specific language.",
    },
    {
      icon: Cpu,
      title: "AI-Powered",
      description:
        "Leverages state-of-the-art language models and embedding techniques for accurate understanding and generation.",
    },
  ]

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features for Financial Analysis</h2>
          <p className="text-lg text-muted-foreground">
            Our advanced RAG system combines cutting-edge AI with financial expertise to deliver accurate, cited
            insights from your documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border border-border hover:border-accent/50 transition-colors">
              <CardHeader>
                <div className="mb-4 rounded-lg bg-accent/10 p-3 w-fit">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
