import { Link } from "react-router-dom";
import { MapPin, Users, Heart, Sparkles, ArrowRight, Briefcase } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
}

const jobListings: JobListing[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote (USA)",
    type: "Full-time",
  },
  {
    id: "2",
    title: "AI/ML Engineer",
    department: "AI Research",
    location: "San Francisco, CA",
    type: "Full-time",
  },
  {
    id: "3",
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: "4",
    title: "Fashion Buyer",
    department: "Merchandising",
    location: "New York, NY",
    type: "Full-time",
  },
  {
    id: "5",
    title: "Customer Success Manager",
    department: "Customer Experience",
    location: "Remote (USA)",
    type: "Full-time",
  },
  {
    id: "6",
    title: "Marketing Specialist",
    department: "Marketing",
    location: "Los Angeles, CA",
    type: "Full-time",
  },
];

const perks = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision insurance plus wellness stipend",
  },
  {
    icon: MapPin,
    title: "Remote-First",
    description: "Work from anywhere with flexible hours and unlimited PTO",
  },
  {
    icon: Users,
    title: "Team Culture",
    description: "Regular team events, offsites, and a collaborative environment",
  },
  {
    icon: Sparkles,
    title: "Growth & Learning",
    description: "Professional development budget and mentorship opportunities",
  },
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="section-container py-16 lg:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Join the{" "}
            <span className="gradient-ai-text">Future of Fashion</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8">
            We're revolutionizing how people shop for clothes with AI technology. 
            Come build the future with us.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#openings">View Open Positions</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/about">About Fitverse</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-container py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Values</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Innovation First</h3>
            <p className="text-muted-foreground">
              We push boundaries and embrace cutting-edge technology to create 
              experiences that matter.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Customer Obsessed</h3>
            <p className="text-muted-foreground">
              Every decision starts with our customers. Their success is our success.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Authenticity</h3>
            <p className="text-muted-foreground">
              We believe in being genuine, transparent, and true to ourselves and our mission.
            </p>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="section-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Join Fitverse?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We believe in taking care of our team
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {perks.map((perk) => (
            <div
              key={perk.title}
              className="glass rounded-2xl border border-border/50 p-6 flex gap-4"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <perk.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Job Listings */}
      <section id="openings" className="section-container py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Open Positions</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find your perfect role and help us shape the future of fashion tech
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {jobListings.map((job) => (
            <div
              key={job.id}
              className="glass rounded-xl border border-border/50 p-6 hover:border-accent hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                      {job.type}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Don't see your role? We're always looking for talented people.
          </p>
          <Button variant="outline" size="lg">
            Send Us Your Resume
          </Button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-container py-16">
        <div className="glass rounded-3xl border border-border/50 p-8 lg:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to get notified about new job openings and company updates
          </p>
          <form className="flex gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
