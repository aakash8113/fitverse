import { Ruler } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SizeGuide() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">Size Guide</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your perfect fit with our comprehensive sizing charts and measurement
              guide
            </p>
          </div>

          <div className="glass rounded-2xl border border-border/50 p-6 lg:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Ruler className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold">How to Measure</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Chest</h3>
                <p className="text-sm text-muted-foreground">
                  Measure around the fullest part of your chest, keeping the tape parallel
                  to the floor
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Waist</h3>
                <p className="text-sm text-muted-foreground">
                  Measure around your natural waistline, keeping the tape comfortably
                  loose
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hips</h3>
                <p className="text-sm text-muted-foreground">
                  Measure around the fullest part of your hips, approximately 8 inches
                  below your waist
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="tops" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="tops">Tops</TabsTrigger>
              <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
              <TabsTrigger value="dresses">Dresses</TabsTrigger>
            </TabsList>

            {/* Tops */}
            <TabsContent value="tops">
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-6 bg-accent/5 border-b border-border/50">
                  <h3 className="text-xl font-semibold">Tops & T-Shirts</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    US sizing - Measurements in inches
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 font-semibold">Size</th>
                        <th className="text-left p-4 font-semibold">Chest</th>
                        <th className="text-left p-4 font-semibold">Waist</th>
                        <th className="text-left p-4 font-semibold">Length</th>
                        <th className="text-left p-4 font-semibold">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="p-4">XS</td>
                        <td className="p-4 text-muted-foreground">32-34</td>
                        <td className="p-4 text-muted-foreground">26-28</td>
                        <td className="p-4 text-muted-foreground">26</td>
                        <td className="p-4 text-muted-foreground">32</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">S</td>
                        <td className="p-4 text-muted-foreground">34-36</td>
                        <td className="p-4 text-muted-foreground">28-30</td>
                        <td className="p-4 text-muted-foreground">27</td>
                        <td className="p-4 text-muted-foreground">33</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">M</td>
                        <td className="p-4 text-muted-foreground">38-40</td>
                        <td className="p-4 text-muted-foreground">32-34</td>
                        <td className="p-4 text-muted-foreground">28</td>
                        <td className="p-4 text-muted-foreground">34</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">L</td>
                        <td className="p-4 text-muted-foreground">42-44</td>
                        <td className="p-4 text-muted-foreground">36-38</td>
                        <td className="p-4 text-muted-foreground">29</td>
                        <td className="p-4 text-muted-foreground">35</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">XL</td>
                        <td className="p-4 text-muted-foreground">46-48</td>
                        <td className="p-4 text-muted-foreground">40-42</td>
                        <td className="p-4 text-muted-foreground">30</td>
                        <td className="p-4 text-muted-foreground">36</td>
                      </tr>
                      <tr>
                        <td className="p-4">XXL</td>
                        <td className="p-4 text-muted-foreground">50-52</td>
                        <td className="p-4 text-muted-foreground">44-46</td>
                        <td className="p-4 text-muted-foreground">31</td>
                        <td className="p-4 text-muted-foreground">37</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Bottoms */}
            <TabsContent value="bottoms">
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-6 bg-accent/5 border-b border-border/50">
                  <h3 className="text-xl font-semibold">Pants & Jeans</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    US sizing - Measurements in inches
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 font-semibold">Size</th>
                        <th className="text-left p-4 font-semibold">Waist</th>
                        <th className="text-left p-4 font-semibold">Hips</th>
                        <th className="text-left p-4 font-semibold">Inseam</th>
                        <th className="text-left p-4 font-semibold">Rise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="p-4">26</td>
                        <td className="p-4 text-muted-foreground">26</td>
                        <td className="p-4 text-muted-foreground">34-35</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">9</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">28</td>
                        <td className="p-4 text-muted-foreground">28</td>
                        <td className="p-4 text-muted-foreground">36-37</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">9.5</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">30</td>
                        <td className="p-4 text-muted-foreground">30</td>
                        <td className="p-4 text-muted-foreground">38-39</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">10</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">32</td>
                        <td className="p-4 text-muted-foreground">32</td>
                        <td className="p-4 text-muted-foreground">40-41</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">10.5</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">34</td>
                        <td className="p-4 text-muted-foreground">34</td>
                        <td className="p-4 text-muted-foreground">42-43</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">11</td>
                      </tr>
                      <tr>
                        <td className="p-4">36</td>
                        <td className="p-4 text-muted-foreground">36</td>
                        <td className="p-4 text-muted-foreground">44-45</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">11.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Dresses */}
            <TabsContent value="dresses">
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-6 bg-accent/5 border-b border-border/50">
                  <h3 className="text-xl font-semibold">Dresses</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    US sizing - Measurements in inches
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 font-semibold">Size</th>
                        <th className="text-left p-4 font-semibold">Bust</th>
                        <th className="text-left p-4 font-semibold">Waist</th>
                        <th className="text-left p-4 font-semibold">Hips</th>
                        <th className="text-left p-4 font-semibold">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="p-4">XS (0-2)</td>
                        <td className="p-4 text-muted-foreground">32-33</td>
                        <td className="p-4 text-muted-foreground">24-25</td>
                        <td className="p-4 text-muted-foreground">34-35</td>
                        <td className="p-4 text-muted-foreground">35</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">S (4-6)</td>
                        <td className="p-4 text-muted-foreground">34-35</td>
                        <td className="p-4 text-muted-foreground">26-27</td>
                        <td className="p-4 text-muted-foreground">36-37</td>
                        <td className="p-4 text-muted-foreground">36</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">M (8-10)</td>
                        <td className="p-4 text-muted-foreground">36-37</td>
                        <td className="p-4 text-muted-foreground">28-29</td>
                        <td className="p-4 text-muted-foreground">38-39</td>
                        <td className="p-4 text-muted-foreground">37</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-4">L (12-14)</td>
                        <td className="p-4 text-muted-foreground">38-40</td>
                        <td className="p-4 text-muted-foreground">30-32</td>
                        <td className="p-4 text-muted-foreground">40-42</td>
                        <td className="p-4 text-muted-foreground">38</td>
                      </tr>
                      <tr>
                        <td className="p-4">XL (16-18)</td>
                        <td className="p-4 text-muted-foreground">42-44</td>
                        <td className="p-4 text-muted-foreground">34-36</td>
                        <td className="p-4 text-muted-foreground">44-46</td>
                        <td className="p-4 text-muted-foreground">39</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

          </Tabs>

          <div className="mt-8 glass rounded-2xl border border-border/50 p-8 bg-gradient-to-br from-accent/10 to-transparent">
            <h3 className="text-xl font-semibold mb-4">Still Not Sure About Your Size?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Check Reviews</h4>
                <p className="text-sm text-muted-foreground">
                  Customer reviews often include fit feedback and sizing recommendations
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Free Returns</h4>
                <p className="text-sm text-muted-foreground">
                  Enjoy hassle-free returns within 7 days if the fit isn't perfect
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Contact Us</h4>
                <p className="text-sm text-muted-foreground">
                  Our team can help with sizing questions - just reach out!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
