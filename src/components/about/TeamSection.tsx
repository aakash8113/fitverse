import { ScrollReveal } from "./ScrollReveal";
import { motion } from "framer-motion";

const team = [
  {
    name: "Naman Tiwari",
    role: "CEO",
    focus: "Vision & Strategy",
    bio: "3rd year Mechanical Engineering student with a passion for innovation and sustainable business practices.",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    name: "Aakash Patel",
    role: "CTO",
    focus: "AI Engineer & Software Developer",
    bio: "3rd year Computer Science student with a passion for AI and software development.",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    name: "Poojan Jani",
    role: "CFO",
    focus: "Financial Strategy & Web Development",
    bio: "2nd year Computer Science student with a passion for finance and web development.",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    name: "Devam Patil",
    role: "CMO",
    focus: "Marketing & Design",
    bio: "3rd year Mechanical Engineering student with a passion for marketing and design.",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
  },
];

export function TeamSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4 font-medium">
              The People
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              A multidisciplinary team united by the belief that fashion should be personal, accessible, and sustainable.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <ScrollReveal key={member.name} delay={0.12 * (i + 1)}>
              <div className="group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-5 relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 transition-all duration-500 flex items-end p-5">
                    <p className="text-background text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                      {member.bio}
                    </p>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
                <p className="text-xs text-muted-foreground/70 mt-1 uppercase tracking-wider">
                  {member.focus}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
