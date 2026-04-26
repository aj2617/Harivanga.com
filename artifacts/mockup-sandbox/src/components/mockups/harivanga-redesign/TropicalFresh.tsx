import React from "react";
import { 
  ShoppingCart, 
  Menu, 
  Leaf, 
  Clock, 
  Users, 
  Tractor, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Truck,
  Phone
} from "lucide-react";

export function TropicalFresh() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-orange-200 selection:text-orange-900">
      {/* Announcement Bar */}
      <div className="bg-emerald-600 text-white text-center py-2 px-4 text-sm font-medium tracking-wide">
        Season 2026 Now Open — Order Fresh Harivanga Today!
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-emerald-700">Harivanga<span className="text-orange-500">.com</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              <a href="#" className="px-4 py-2 rounded-full text-emerald-800 font-medium hover:bg-emerald-50 transition-colors">Home</a>
              <a href="#" className="px-4 py-2 rounded-full text-slate-600 font-medium hover:bg-emerald-50 hover:text-emerald-800 transition-colors">Shop</a>
              <a href="#" className="px-4 py-2 rounded-full text-slate-600 font-medium hover:bg-emerald-50 hover:text-emerald-800 transition-colors">Our Farm</a>
              <a href="#" className="px-4 py-2 rounded-full text-slate-600 font-medium hover:bg-emerald-50 hover:text-emerald-800 transition-colors">Contact</a>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 border-2 border-white rounded-full">
                  2
                </span>
              </button>
              <button className="md:hidden p-2 text-emerald-800 hover:bg-emerald-50 rounded-full">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-50/50 pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-200/40 blur-3xl mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-200/40 blur-3xl mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm mb-6 border border-emerald-200 shadow-sm">
                <span className="flex w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                Fresh Harvest Now Available
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl mb-6">
                <span className="block">Taste the Finest</span>
                <span className="block text-emerald-600">Harivanga Mangoes</span>
                <span className="block text-3xl sm:text-4xl text-slate-600 mt-2 font-medium">from Rangpur</span>
              </h1>
              <p className="mt-3 text-base text-slate-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 mb-8">
                Hand-picked, tree-ripened, and chemical-free. Experience the authentic sweetness of Bangladesh's most premium mango variety, delivered directly from our farms to your door.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-4">
                <button className="w-full sm:w-auto flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-white bg-orange-500 hover:bg-orange-600 md:text-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-1">
                  Order Now <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <button className="mt-3 sm:mt-0 w-full sm:w-auto flex items-center justify-center px-8 py-4 border-2 border-emerald-600 text-base font-bold rounded-full text-emerald-700 bg-transparent hover:bg-emerald-50 md:text-lg transition-all">
                  Watch Farm Tour
                </button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-2xl shadow-2xl lg:max-w-md overflow-hidden aspect-square">
                <img 
                  className="w-full h-full object-cover" 
                  src="/__mockup/images/mango-hero.png" 
                  alt="Fresh Harivanga Mangoes" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-transparent mix-blend-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="relative z-10 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-50 p-6 md:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Leaf, label: "100% Organic", sub: "Chemical-free" },
              { icon: Clock, label: "48h Delivery", sub: "Nationwide" },
              { icon: Users, label: "10,000+", sub: "Happy Customers" },
              { icon: Tractor, label: "Farm Direct", sub: "From Rangpur" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform group-hover:bg-emerald-100">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base">{stat.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">Fresh Arrival</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Premium Selections</h3>
            <p className="mt-4 text-lg text-slate-600">Carefully graded and sorted to ensure you only get the best of the harvest.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Premium Harivanga (Large)", price: "1200", weight: "10 kg Box", image: "/__mockup/images/harivanga-box.png", tag: "Best Seller" },
              { name: "Export Quality Harivanga", price: "2500", weight: "20 kg Box", image: "/__mockup/images/harivanga-box.png", tag: "Popular" },
              { name: "Family Pack Harivanga", price: "650", weight: "5 kg Box", image: "/__mockup/images/harivanga-premium.png" },
              { name: "Gift Box (Premium)", price: "1500", weight: "10 kg Crate", image: "/__mockup/images/harivanga-premium.png", tag: "Gift Choice" },
            ].map((product, i) => (
              <div key={i} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-square bg-slate-50 p-6 flex items-center justify-center overflow-hidden">
                  {product.tag && (
                    <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {product.tag}
                    </div>
                  )}
                  <img src={product.image} alt={product.name} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="text-xs text-emerald-600 font-semibold mb-1">{product.weight}</div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2 flex-grow">{product.name}</h4>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <span className="text-xl font-extrabold text-slate-900">৳{product.price}</span>
                    <button className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-2">Our Promise</h2>
              <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-6">Why Choose Our Mangoes?</h3>
              <p className="text-lg text-slate-600 mb-8">
                We believe in delivering nature's best right to your doorstep. Our process ensures maximum freshness and quality.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: "Carbide Free Guarantee", desc: "Naturally ripened on trees, absolutely no harmful chemicals used." },
                  { icon: Tractor, title: "Direct from Farmers", desc: "No middlemen. Fair prices for farmers, fresh produce for you." },
                  { icon: Truck, title: "Careful Packaging", desc: "Specially designed ventilated boxes to prevent transit damage." }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{feature.title}</h4>
                      <p className="mt-1 text-slate-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="/__mockup/images/harivanga-premium.png" alt="Farm" className="rounded-2xl w-full h-64 object-cover mt-8 shadow-lg" />
              <img src="/__mockup/images/harivanga-box.png" alt="Mangoes" className="rounded-2xl w-full h-64 object-cover shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">Loved by Thousands</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Rafiqul Islam", role: "Dhaka", text: "The most authentic Harivanga I've ever tasted. The packaging was excellent and delivery was right on time." },
              { name: "Nusrat Jahan", role: "Chittagong", text: "Ordered 20kg for my family. Every single mango was perfect, no spots or damage. Highly recommended!" },
              { name: "Ahmed Zubair", role: "Sylhet", text: "Finally found a reliable source for chemical-free mangoes. The taste is exactly like what we used to get from village." }
            ].map((review, i) => (
               <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                 <div className="flex text-orange-400 mb-4">
                   {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                 </div>
                 <p className="text-slate-700 mb-6 italic">"{review.text}"</p>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                     {review.name.charAt(0)}
                   </div>
                   <div>
                     <h5 className="font-bold text-slate-900 text-sm">{review.name}</h5>
                     <p className="text-xs text-slate-500">{review.role}</p>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to taste the best of Rangpur?</h2>
          <p className="text-emerald-100 mb-8 text-lg">Limited stock available for this season. Order now before we run out.</p>
          <button className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-emerald-900 bg-orange-400 hover:bg-orange-500 transition-colors shadow-lg">
            Shop All Mangoes
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Leaf className="w-6 h-6 text-emerald-500" />
                <span className="font-bold text-2xl text-white">Harivanga<span className="text-emerald-500">.com</span></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Delivering the finest, chemical-free Harivanga mangoes directly from the orchards of Rangpur to your doorstep.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Quick Links</h4>
              <ul className="space-y-3">
                {['Shop Mangoes', 'About Our Farm', 'Track Order', 'FAQs'].map(link => (
                  <li key={link}><a href="#" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Legal</h4>
              <ul className="space-y-3">
                {['Terms & Conditions', 'Privacy Policy', 'Refund Policy', 'Shipping Info'].map(link => (
                  <li key={link}><a href="#" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Contact</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>+880 1234-567890<br/>(9AM - 8PM)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>info@harivanga.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">© 2026 Harivanga.com. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              Accepted Payments: <span className="font-bold text-white ml-2">bKash</span> <span className="font-bold text-white ml-2">Nagad</span> <span className="font-bold text-white ml-2">COD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
