import { HelpCircle, Package, Truck, CreditCard, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Orders & Payment",
    icon: CreditCard,
    questions: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. All payments are securely processed and encrypted.",
      },
      {
        question: "Can I modify or cancel my order?",
        answer:
          "You can modify or cancel your order within 1 hour of placement by contacting our customer service. After this window, your order enters processing and cannot be changed. However, you can always return items according to our return policy.",
      },
      {
        question: "Do you offer gift cards?",
        answer:
          "Yes! Gift cards are available in denominations of ₹25, ₹50, ₹100, and ₹200. They can be purchased on our website and delivered via email instantly.",
      },
      {
        question: "Why was my payment declined?",
        answer:
          "Payment declines can occur for various reasons including insufficient funds, incorrect card information, or security flags from your bank. Please verify your information and contact your bank if the issue persists.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    icon: Truck,
    questions: [
      {
        question: "How long does shipping take?",
        answer:
          "Standard shipping takes 5-7 business days, Express shipping takes 2-3 business days, and Next Day delivery is available for orders placed before 2 PM EST. International shipping varies by destination (7-14 business days).",
      },
      {
        question: "Do you ship internationally?",
        answer:
          "Yes! We ship to over 100 countries worldwide. International shipping costs and delivery times vary by destination. Customs duties and taxes are the responsibility of the recipient.",
      },
      {
        question: "How can I track my order?",
        answer:
          "Once your order ships, you'll receive a tracking number via email. You can track your package on our Track Order page or directly through the carrier's website (FedEx, UPS, USPS).",
      },
      {
        question: "What if my package is lost or damaged?",
        answer:
          "If your package is lost or arrives damaged, please contact us immediately with photos (for damaged items). We'll work with the carrier to resolve the issue and either reship your order or provide a full refund.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    icon: RefreshCw,
    questions: [
      {
        question: "What is your return policy?",
        answer:
          "We offer 30-day returns for unworn, unwashed items with original tags attached. Returns are free for most items. Sale and final sale items cannot be returned. Refunds are processed within 5-7 business days of receiving your return.",
      },
      {
        question: "How do I initiate a return?",
        answer:
          "Log into your account, go to Order History, and select 'Request Return' for the item you wish to return. Print the prepaid shipping label and drop off your package at any authorized carrier location.",
      },
      {
        question: "Can I exchange an item?",
        answer:
          "Yes! We offer free exchanges for different sizes or colors. Follow the same process as returns and indicate you want an exchange. We'll ship your replacement item as soon as we receive your return.",
      },
      {
        question: "How long do refunds take?",
        answer:
          "Refunds are processed within 5-7 business days after we receive and inspect your return. Please allow an additional 3-5 business days for the refund to appear on your statement, depending on your bank.",
      },
    ],
  },
  {
    title: "Products & Sizing",
    icon: Package,
    questions: [
      {
        question: "How do I find my size?",
        answer:
          "Check our comprehensive Size Guide which includes detailed measurements for all product categories. We recommend measuring yourself and comparing to our size charts for the best fit. Customer reviews often mention sizing accuracy too.",
      },
      {
        question: "Are your products true to size?",
        answer:
          "Most of our products run true to size, but this can vary by brand and style. Each product page includes fit information (e.g., 'runs small,' 'relaxed fit') and customer reviews with sizing feedback.",
      },
      {
        question: "Do you offer plus sizes?",
        answer:
          "Yes! We're committed to inclusivity and offer extended sizing (XS-3XL) across most of our collections. Look for the 'Extended Sizes' filter when shopping.",
      },
      {
        question: "How do I care for my garments?",
        answer:
          "Care instructions are included on the tag of each garment and on the product page. Generally, we recommend washing in cold water, gentle cycle, and air drying to maintain quality and longevity.",
      },
    ],
  },
  {
    title: "Account & General",
    icon: HelpCircle,
    questions: [
      {
        question: "Do I need an account to place an order?",
        answer:
          "No, you can checkout as a guest. However, creating an account allows you to track orders, save addresses, view order history, and receive exclusive member benefits and early access to sales.",
      },
      {
        question: "How do I reset my password?",
        answer:
          "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. If you don't receive it within 5 minutes, check your spam folder.",
      },
      {
        question: "Can I save items for later?",
        answer:
          "Yes! Use the Wishlist feature to save items you're interested in. Simply click the heart icon on any product. Your wishlist is saved to your account and accessible across devices.",
      },
      {
        question: "Do you have a loyalty program?",
        answer:
          "Yes! Our Fitverse Rewards program offers points for every purchase, birthday bonuses, early access to sales, and exclusive member-only events. Sign up is free and automatic when you create an account.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about orders, shipping, returns, and more
            </p>
          </div>

          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="glass rounded-2xl border border-border/50 p-6 lg:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <category.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-2xl font-semibold">{category.title}</h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      value={`item-${categoryIndex}-${itemIndex}`}
                    >
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-12 glass rounded-2xl border border-border/50 p-8 text-center bg-gradient-to-br from-accent/10 to-transparent">
            <h3 className="text-xl font-semibold mb-2">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our customer support team is here
              to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact">
                <button className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                  Contact Support
                </button>
              </a>
              <a href="mailto:support@fitverse.com">
                <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                  Email Us
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
