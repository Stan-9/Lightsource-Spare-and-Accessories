import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/shared/Header';
import { useCart } from '../context/CartContext';
import { updateSEO } from '../services/seo';
import { 
  ChevronRight, Star, Heart, Share2, 
  MessageSquare, Compass, ShieldAlert, ArrowLeft, 
  ShoppingBag, Check, Info, Settings 
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Related
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'reviews'

  // Fetch product, reviews, and related items
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          setError('Product not found in inventory catalog.');
          setLoading(false);
          return;
        }

        const productData = { id: productSnap.id, ...productSnap.data() };
        setProduct(productData);

        // Fetch related products (same category)
        const productsCol = collection(db, 'products');
        const querySnapshot = await getDocs(productsCol);
        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filteredRelated = allProducts
          .filter(p => p.category === productData.category && p.id !== productData.id && p.isVisible !== false)
          .slice(0, 3);
        setRelatedProducts(filteredRelated);

        // Fetch reviews
        const reviewsRef = collection(db, 'products', id, 'reviews');
        const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviewsList = reviewsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setReviews(reviewsList);

      } catch (err) {
        console.error("Error loading product detail:", err);
        setError('Error fetching part details. Connection failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // Handle Review Submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    setSubmittingReview(true);
    try {
      const reviewData = {
        name: reviewName,
        rating: Number(reviewRating),
        comment: reviewComment,
        createdAt: new Date()
      };

      const reviewsRef = collection(db, 'products', id, 'reviews');
      await addDoc(reviewsRef, reviewData);

      setReviews(prev => [reviewData, ...prev]);
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error("Error saving review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // SEO Schema & Meta Management
  useEffect(() => {
    if (!product) return;

    const title = `${product.name} - Genuine Spare Parts`;
    const description = product.description 
      ? product.description.slice(0, 155) 
      : `Acquire genuine ${product.name} from LightSource Motors. Certified compatibility and durability.`;
    const canonical = `${window.location.origin}/product/${product.id}`;

    // Schema.org Structured Data
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
      : "5.0";
    
    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": product.imageUrl || "",
      "description": product.description || "Certified genuine motorbike spare parts.",
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "LightSource Genuine Parts"
      },
      "offers": {
        "@type": "Offer",
        "url": canonical,
        "priceCurrency": "KES",
        "price": product.price,
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };

    if (reviews.length > 0) {
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": avgRating,
        "reviewCount": reviews.length,
        "bestRating": "5",
        "worstRating": "1"
      };
      productSchema.review = reviews.map(r => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.name
        },
        "datePublished": r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : "",
        "reviewBody": r.comment,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating,
          "bestRating": "5",
          "worstRating": "1"
        }
      }));
    }

    updateSEO({
      title,
      description,
      canonicalUrl: canonical,
      schemaData: productSchema
    });
  }, [product, reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accentOrange" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-20 text-center max-w-lg">
          <ShieldAlert className="w-12 h-12 text-brakeRed mx-auto mb-6" />
          <h2 className="text-2xl font-black font-technical uppercase tracking-tighter mb-4">Verification Error</h2>
          <p className="text-gray-500 mb-8 uppercase text-xs tracking-wider">{error || 'Unknown catalog mismatch.'}</p>
          <Link to="/catalog" className="inline-flex items-center gap-2 border-2 border-machineGray hover:border-accentOrange px-6 py-3 font-black text-xs uppercase tracking-widest font-technical rounded-sm transition-all text-white">
            <ArrowLeft className="w-4 h-4" />
            Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const cartItem = cartItems.find(item => item.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const maxReached = inCartQty >= product.stock;

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col font-utilitarian selection:bg-accentOrange/30">
      <Header />

      {/* Breadcrumb navigation */}
      <nav className="container mx-auto px-4 py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 font-technical border-b border-machineGray/30">
        <Link to="/" className="hover:text-accentOrange">Home</Link>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <Link to="/catalog" className="hover:text-accentOrange">Catalog</Link>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <Link to={`/catalog/${product.category?.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-accentOrange">{product.category}</Link>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <span className="text-accentOrange truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product Information Grid */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Column 1: Image container */}
          <div className="lg:col-span-7 bg-pitchBlack border-2 border-machineGray rounded-sm p-4 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 bg-machineGray text-[8px] font-black px-2 py-0.5 text-gray-500 uppercase tracking-widest font-technical">
              Catalog Reference: REF-{product.id.slice(0, 8)}
            </div>

            <div className="w-full max-w-xl aspect-square flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all duration-700"
                />
              ) : (
                <Settings className="w-24 h-24 text-machineGray animate-spin-slow opacity-20" />
              )}
            </div>
          </div>

          {/* Column 2: Specs & Cart controls */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="border-b border-machineGray/50 pb-6 mb-6">
              <span className="bg-machineGray/60 px-3 py-1 border border-machineGray text-[9px] font-black uppercase tracking-[0.25em] font-technical text-accentOrange rounded-sm">
                {product.category || 'Genuine Machinery'}
              </span>
              
              <h1 className="text-3xl sm:text-4xl font-black text-white font-technical uppercase tracking-tighter mt-4 leading-tight">
                {product.name}
              </h1>

              {/* Technical Ratings */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`w-4 h-4 ${idx < 4 ? 'fill-accentOrange text-accentOrange' : 'text-gray-600'}`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-technical">
                  {reviews.length} Verified Reviews
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] font-technical mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-utilitarian uppercase tracking-wide border-l-2 border-machineGray pl-4">
                {product.description || 'No additional technical notes registered for this serial block. Certifed for standardized industrial deployment.'}
              </p>
            </div>

            {/* Price block */}
            <div className="bg-machineGray/20 border-2 border-machineGray/50 p-6 rounded-sm mb-8 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] font-technical block mb-1">MSRP Trade Price</span>
                <span className="text-3xl font-black text-white font-technical">
                  <span className="text-accentOrange text-sm mr-1">KES</span>
                  {product.price.toLocaleString()}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] font-technical block mb-1">Status</span>
                <span className={`text-xs font-black uppercase tracking-widest ${isOutOfStock ? 'text-brakeRed' : 'text-machineryGreen'}`}>
                  {isOutOfStock ? 'Out of Stock' : `operational: ${product.stock} units`}
                </span>
              </div>
            </div>

            {/* Cart Buttons */}
            <div className="flex flex-col gap-4">
              <button
                disabled={isOutOfStock || maxReached}
                onClick={() => addToCart(product)}
                className={`py-4 rounded-sm font-black text-xs uppercase tracking-[0.3em] w-full flex justify-center items-center gap-3 transition-all duration-300 font-technical ${
                  isOutOfStock 
                    ? 'bg-machineGray/20 text-gray-700 cursor-not-allowed border border-machineGray/50'
                    : maxReached
                      ? 'bg-machineGray/40 text-gray-500 cursor-not-allowed border border-machineGray'
                      : 'bg-accentOrange hover:bg-accentOrange/80 text-white shadow-[0_10px_35px_rgba(200,122,62,0.2)]'
                }`}
              >
                {isOutOfStock ? 'DEPLETED INVENTORY' : maxReached ? 'LIMIT OBTAINED' : 'ADD TO PROCUREMENT CART'}
              </button>

              {inCartQty > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-machineryGreen font-technical bg-machineryGreen/10 border border-machineryGreen/20 py-3 rounded-sm">
                  <Check className="w-4 h-4" />
                  <span>{inCartQty} unit(s) reserved in cart</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab section: Specs and Reviews */}
        <section className="mt-20 border-t border-machineGray/30 pt-12">
          <div className="flex gap-8 border-b border-machineGray/20 pb-4 mb-8">
            <button 
              onClick={() => setActiveTab('specs')}
              className={`text-xs font-black uppercase tracking-[0.3em] font-technical transition ${activeTab === 'specs' ? 'text-accentOrange border-b-2 border-accentOrange pb-4' : 'text-gray-500 hover:text-white'}`}
            >
              Specs & Compatibility
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`text-xs font-black uppercase tracking-[0.3em] font-technical transition ${activeTab === 'reviews' ? 'text-accentOrange border-b-2 border-accentOrange pb-4' : 'text-gray-500 hover:text-white'}`}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {activeTab === 'specs' ? (
            <div className="max-w-3xl">
              <h2 className="text-xl font-black font-technical uppercase tracking-tight text-white mb-6">Technical Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-machineGray/40 p-4 rounded-sm bg-pitchBlack">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] block mb-1">Standard Weight</span>
                  <span className="text-white text-xs font-bold font-technical">1.45 KG</span>
                </div>
                <div className="border border-machineGray/40 p-4 rounded-sm bg-pitchBlack">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] block mb-1">Certification Code</span>
                  <span className="text-white text-xs font-bold font-technical">ISO-9001 CE Certified</span>
                </div>
                <div className="border border-machineGray/40 p-4 rounded-sm bg-pitchBlack">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] block mb-1">Compatibility Profile</span>
                  <span className="text-white text-xs font-bold font-technical">Universal OEM fitment for related {product.category} classes</span>
                </div>
                <div className="border border-machineGray/40 p-4 rounded-sm bg-pitchBlack">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] block mb-1">Material Composition</span>
                  <span className="text-white text-xs font-bold font-technical">Heavy Duty Reinforced Alloys & Polymers</span>
                </div>
              </div>

              <div className="mt-8 p-6 bg-machineGray/10 border border-machineGray/30 rounded-sm">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accentOrange mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Fitment & Installation Guide
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed uppercase tracking-wider">
                  Always consult the manufacturer manual or request support at our resources desk. High-stress fitments should be managed by a registered mechanical operator.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">
              <h2 className="text-xl font-black font-technical uppercase tracking-tight text-white mb-6">Customer Reviews</h2>
              
              {/* Form to submit review */}
              <form onSubmit={handleReviewSubmit} className="bg-machineGray/20 p-6 border-2 border-machineGray rounded-sm mb-10">
                <h4 className="text-xs font-black font-technical uppercase tracking-[0.2em] text-white mb-4">Write a Review</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1 font-technical">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="ENTER NAME..." 
                      className="w-full bg-pitchBlack border border-machineGray text-white p-3 text-xs uppercase font-technical focus:outline-none focus:border-accentOrange"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1 font-technical">Rating</label>
                    <select 
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      className="w-full bg-pitchBlack border border-machineGray text-white p-3 text-xs uppercase font-technical focus:outline-none focus:border-accentOrange"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Poor)</option>
                      <option value="1">1 Star (Defective)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1 font-technical">Comment</label>
                  <textarea 
                    required
                    rows="3"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="ENTER EXPERIENCE..." 
                    className="w-full bg-pitchBlack border border-machineGray text-white p-3 text-xs uppercase tracking-wider focus:outline-none focus:border-accentOrange"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submittingReview}
                  className="bg-accentOrange hover:bg-accentOrange/80 text-white font-black text-[10px] uppercase tracking-[0.3em] font-technical px-8 py-3 transition rounded-sm"
                >
                  {submittingReview ? 'SUBMITTING...' : 'SUBMIT VERIFIED REVIEW'}
                </button>
              </form>

              {/* Reviews List */}
              <div className="flex flex-col gap-6">
                {reviews.length > 0 ? (
                  reviews.map((r, index) => (
                    <div key={r.id || index} className="border-b border-machineGray/20 pb-6 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase font-technical text-white">{r.name}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-3.5 h-3.5 ${idx < r.rating ? 'fill-accentOrange text-accentOrange' : 'text-gray-700'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-600 text-xs uppercase font-technical tracking-widest">
                    No reviews submitted for this block registry yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 border-t border-machineGray/30 pt-16">
            <h2 className="text-2xl font-black font-technical uppercase tracking-tight text-white mb-10">Related Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map(p => (
                <div key={p.id} className="bg-machineGray/10 border-2 border-machineGray/40 hover:border-accentOrange p-4 rounded-sm transition flex flex-col group">
                  <div className="relative aspect-video bg-pitchBlack flex items-center justify-center overflow-hidden mb-4 border border-machineGray/50">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition" />
                    ) : (
                      <Settings className="w-10 h-10 text-machineGray/50 animate-spin-slow" />
                    )}
                  </div>
                  <Link to={`/product/${p.id}`} className="hover:text-accentOrange block">
                    <h4 className="text-xs font-black uppercase font-technical text-white truncate group-hover:text-accentOrange transition-colors">{p.name}</h4>
                  </Link>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2 block font-technical">KES {p.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
