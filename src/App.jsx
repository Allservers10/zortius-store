import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Shield, Zap, Star, CheckCircle,
  Package, User, Search, Menu, X, ArrowRight, Lock, Trash2,
  Plus, Minus, RefreshCw, AlertCircle, LogIn, LogOut, UserCheck, Eye, EyeOff, CreditCard,
  Tag, PlusCircle, Edit3, PackageCheck, Send, Bot, Sparkles, Headphones, MapPin, Calendar, FileText, Layers, ClipboardCheck, Users, Wand2, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, collection, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, where
} from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// =========================================================================
// CONFIG
// =========================================================================
const EMAILJS_SERVICE_ID = 'service_0606epp';
const EMAILJS_CONTACT_TEMPLATE_ID = 'template_h7ffmct';
const EMAILJS_ORDER_TEMPLATE_ID = 'template_pfqrr0l';
const EMAILJS_PUBLIC_KEY = 'ce23vL3ytn68UIxsf';

const ADMIN_EMAIL = 'zortiusofficial@gmail.com';
const LIMITED_ADMIN_EMAIL = 'gto.zortius@outlook.com';
const SUPPORT_EMAIL = 'help@zortius.com';

const renderSafe = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return fallback;
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'zortius-store-v2';
const firebaseConfig = {
  apiKey: 'AIzaSyBhsCLWDETaqh1zytvnNt33O8Lls63mna0',
  authDomain: 'auth.zortius.com',
  projectId: 'zortiusweb1',
  storageBucket: 'zortiusweb1.firebasestorage.app',
  messagingSenderId: '345352784478',
  appId: '1:345352784478:web:e2968f2e0d28f5b27182cf',
  measurementId: 'G-DTVERCPFXL'
};

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

const INITIAL_PRODUCTS = [
  {
    id: 'zort-apex-x9',
    name: 'ZORTIUS Apex X9 Ultra Workstation',
    category: 'Workstations',
    price: 3499.0,
    rating: 4.9,
    reviewsCount: 42,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80'],
    description:
      'Engineered for extreme computational demands. Features bespoke liquid immersion cooling, redundant power architectures, and uncompromised multi-threaded throughput for professional simulation and rendering.',
    specs: ['64-Core Thread Processor', '128GB ECC DDR5 RAM', 'Dual PCIe Gen 5 Workstation Graphics', '4TB NVMe Ultra-Dense Storage'],
    options: { colors: ['Dark Anodized', 'Titanium Silver'] },
    isPreorder: true
  },
  {
    id: 'zort-core-pro',
    name: 'ZORTIUS Core Pro Desktop Chassis',
    category: 'Desktops',
    price: 1899.0,
    rating: 4.8,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80'],
    description:
      'Precision-milled anodized aluminum chassis paired with acoustically optimized thermal tunnels. Built for pristine signal integrity and silent operation under heavy sustained workloads.',
    specs: ['Acoustically Tuned Airflow', 'Modular Toolless Bays', 'Anodized Gunmetal Finish', 'Integrated Cable Routing Matrix'],
    options: { colors: ['Gunmetal Black', 'Matte White'] },
    isPreorder: true
  },
  {
    id: 'zort-quantum-display',
    name: 'ZORTIUS Quantum 32 Pro Monitor',
    category: 'Displays',
    price: 1149.0,
    rating: 4.9,
    reviewsCount: 64,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    description:
      '32-inch 4K UHD professional reference display with 100% DCI-P3 color gamut, hardware calibration support, and thunderbolt 4 passthrough for zero-latency studio environments.',
    specs: ['3840 x 2160 Resolution', '165Hz Refresh Rate', 'Mini-LED Local Dimming', 'Factory Calibrated Delta E < 1'],
    isPreorder: true
  },
  {
    id: 'zort-matrix-array',
    name: 'ZORTIUS Matrix Mechanical Keyboard',
    category: 'Peripherals',
    price: 249.0,
    rating: 4.7,
    reviewsCount: 156,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    description:
      'Crafted from a single block of aerospace-grade aluminum. Custom linear switches factory-lubricated with gasket-mounted acoustic dampening for the ultimate tactile typing experience.',
    specs: ['Hot-Swappable PCB', 'CNC Machined Aluminum Case', 'PBT Double-Shot Keycaps', 'Tri-Mode Wireless Connectivity'],
    isPreorder: true
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFullAdmin, setIsFullAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState({});

  // Applications
  const [applicationSections, setApplicationSections] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [applicationSubmissions, setApplicationSubmissions] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [appTitle, setAppTitle] = useState('');
  const [appSection, setAppSection] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appQuestions, setAppQuestions] = useState([]);
  const [questionDraft, setQuestionDraft] = useState('');
  const [questionType, setQuestionType] = useState('long');
  const [questionMarks, setQuestionMarks] = useState('5');
  const [questionRequired, setQuestionRequired] = useState(true);
  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationAnswers, setApplicationAnswers] = useState({});
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState('Pending');
  const [aiGeneratingQuestions, setAiGeneratingQuestions] = useState(false);
  const [applicationSearch, setApplicationSearch] = useState('');

  const [notification, setNotification] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  // Contact
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactInquiry, setContactInquiry] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);

  // AI
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Products & Discounts
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [discounts, setDiscounts] = useState([
    { id: 'ZORTIUS20', code: 'ZORTIUS20', percent: 20, active: true },
    { id: 'CYBER100', code: 'CYBER100', fixed: 100, active: true }
  ]);
  const [appliedCode, setAppliedCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [selectedColor, setSelectedColor] = useState('Dark Anodized');

  // Admin product form
  const [editingProductId, setEditingProductId] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('Workstations');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodColorOption, setProdColorOption] = useState('Dark Anodized, Titanium Silver');
  const [prodImages, setProdImages] = useState('');
  const [prodVideo, setProdVideo] = useState('');
  const [preorders, setPreorders] = useState([]);
  const [productGalleryIndex, setProductGalleryIndex] = useState(0);
  const [prodIsPreorder, setProdIsPreorder] = useState(true);

  // Blog / Media
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');
  const [blogAllowComments, setBlogAllowComments] = useState(true);
  const [blogAllowLikes, setBlogAllowLikes] = useState(true);
  const [blogComment, setBlogComment] = useState('');

  // Forum
  const [forumThreads, setForumThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [forumTitle, setForumTitle] = useState('');
  const [forumBody, setForumBody] = useState('');
  const [forumReply, setForumReply] = useState('');

  // Support tickets (chatbot escalations)
  const [supportTickets, setSupportTickets] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hi — I\'m Zortius Support. Ask about products, pre-orders, careers, or accounts. Say "human" to reach the team.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [escalateEmail, setEscalateEmail] = useState('');
  const [escalateName, setEscalateName] = useState('');

  // Admin discount form
  const [discCode, setDiscCode] = useState('');
  const [discVal, setDiscVal] = useState('');
  const [discType, setDiscType] = useState('percent');

  // Checkout / Shipping (proper address)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [shipFullName, setShipFullName] = useState('');
  const [shipLine1, setShipLine1] = useState('');
  const [shipLine2, setShipLine2] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipPostcode, setShipPostcode] = useState('');
  const [shipCountry, setShipCountry] = useState('United Kingdom');
  const [shipPhone, setShipPhone] = useState('');

  // Auth
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState('');
  const [emailVerifiedMap, setEmailVerifiedMap] = useState({});
  const [otpGateActive, setOtpGateActive] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  // Store control (admin)
  const [storeSettings, setStoreSettings] = useState({
    takingOrders: false,
    announcement: 'Pre-order interest is open. Full checkout launches soon.',
    statusLabel: 'Pre-order mode'
  });
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [ticketReply, setTicketReply] = useState({});
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletters, setNewsletters] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zortius_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLocation, setProfileLocation] = useState('');

  // -------------------- AUTH --------------------
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    let unsub = () => {};

    const applyUser = (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserId(currentUser.uid);
        setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || 'Engineer');
        const em = (currentUser.email || '').toLowerCase().trim();
        setContactEmail(currentUser.email || '');
        setContactName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
        setShipFullName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
        if (isOtpUnlocked(currentUser.uid)) {
          setIsAdmin(em === ADMIN_EMAIL.toLowerCase() || em === LIMITED_ADMIN_EMAIL.toLowerCase());
          setIsFullAdmin(em === ADMIN_EMAIL.toLowerCase());
          setOtpGateActive(false);
          setVerifyMode(false);
        } else {
          // New login only — code once, then remembered until sign-out
          setIsAdmin(false);
          setIsFullAdmin(false);
          setOtpGateActive(true);
          setVerifyMode(true);
          setPendingVerifyEmail(em);
          setProfileModalOpen(true);
          startLoginOtpGate(currentUser);
        }
      } else {
        setUserId(null);
        setUserName('');
        setIsAdmin(false);
        setIsFullAdmin(false);
        setOtpGateActive(false);
        setVerifyMode(false);
        clearOtpUnlocked();
      }
      setAuthLoading(false);
    };

    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.warn('persistence', e);
      }

      // Finish Google redirect FIRST (critical on phones)
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          applyUser(result.user);
          setProfileModalOpen(false);
          setNotification({ message: 'Signed in with Google successfully.', type: 'success' });
          setTimeout(() => setNotification(null), 4000);
        }
      } catch (err) {
        console.error('getRedirectResult error:', err);
        const code = err?.code || '';
        if (code === 'auth/unauthorized-domain') {
          setNotification({
            message: 'Add zortius.vercel.app in Firebase → Authentication → Settings → Authorized domains.',
            type: 'error'
          });
          setTimeout(() => setNotification(null), 7000);
        } else if (code) {
          setNotification({ message: `Google sign-in error: ${code}`, type: 'error' });
          setTimeout(() => setNotification(null), 5000);
        }
      }

      unsub = onAuthStateChanged(auth, (currentUser) => {
        applyUser(currentUser);
      });

      // Phones sometimes restore session a moment later
      if (auth.currentUser) applyUser(auth.currentUser);
      setTimeout(() => {
        if (auth.currentUser) applyUser(auth.currentUser);
      }, 800);
      setTimeout(() => {
        if (auth.currentUser) applyUser(auth.currentUser);
      }, 2000);
    })();

    return () => unsub();
  }, []);


  useEffect(() => {
    if (!db || !userId) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', userId), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() || {};
      if (d.displayName) setUserName(d.displayName);
      if (d.phone) setProfilePhone(d.phone);
      if (d.company) setProfileCompany(d.company);
      if (d.bio) setProfileBio(d.bio);
      if (d.location) setProfileLocation(d.location);
    });
    return () => unsub();
  }, [userId]);

  // Persist cart across refresh (guest + logged-in)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('zortius_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setCart(parsed);
      }
    } catch (_) {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('zortius_cart', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // -------------------- FIRESTORE SYNC --------------------
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'products'), (snapshot) => {
      if (!snapshot.empty) setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'discounts'), (snapshot) => {
      if (!snapshot.empty) setDiscounts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // PRIVATE orders: full admin sees all; others only their own
  useEffect(() => {
    if (!db || !user) {
      if (!user) setOrders([]);
      return;
    }
    let unsub;
    if (isFullAdmin) {
      unsub = onSnapshot(collection(db, 'artifacts', appId, 'orders'), (snapshot) => {
        const loaded = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
        setOrders(loaded.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      });
    } else {
      unsub = onSnapshot(collection(db, 'artifacts', appId, 'orders'), (snapshot) => {
        const loaded = snapshot.docs
          .map((d) => ({ docId: d.id, ...d.data() }))
          .filter((o) => (o.customerEmail || '').toLowerCase() === (user.email || '').toLowerCase());
        setOrders(loaded.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      });
    }
    return () => unsub && unsub();
  }, [user, isFullAdmin]);

  useEffect(() => {
    if (!db) return;
    const unsubs = [
      onSnapshot(collection(db, 'artifacts', appId, 'applicationSections'), (snap) =>
        setApplicationSections(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        )
      ),
      onSnapshot(collection(db, 'artifacts', appId, 'jobApplications'), (snap) =>
        setJobApplications(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        )
      ),
      onSnapshot(collection(db, 'artifacts', appId, 'applicationSubmissions'), (snap) =>
        setApplicationSubmissions(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
        )
      )
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Reviews map
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public_data', 'reviews'), (snap) => {
      if (snap.exists() && snap.data()?.map) setReviews(snap.data().map);
    });
    return () => unsub();
  }, []);

  // Public store settings
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public_data', 'settings'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setStoreSettings({
          takingOrders: !!d.takingOrders,
          announcement: d.announcement || 'Pre-order interest is open. Full checkout launches soon.',
          statusLabel: d.statusLabel || (d.takingOrders ? 'Orders open' : 'Pre-order mode')
        });
        setAnnouncementDraft(d.announcement || '');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zortius_wishlist', JSON.stringify(wishlist));
    } catch (_) {}
  }, [wishlist]);

  const toggleWishlist = (product) => {
    if (!product?.id) return;
    setWishlist((prev) => {
      const exists = prev.some((x) => x.id === product.id);
      if (exists) {
        showNotification('Removed from saved');
        return prev.filter((x) => x.id !== product.id);
      }
      showNotification('Saved for later');
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image }];
    });
  };

  // Cmd+K command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Newsletter signups
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'newsletter'), (snap) => {
      setNewsletters(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
    });
    return () => unsub();
  }, []);

  // Pre-orders list (admin)
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'preorders'), (snap) => {
      setPreorders(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
    });
    return () => unsub();
  }, []);

  // Blog posts
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'blogPosts'), (snap) => {
      setBlogPosts(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
    });
    return () => unsub();
  }, []);

  // Forum threads
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'forumThreads'), (snap) => {
      setForumThreads(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      );
    });
    return () => unsub();
  }, []);

  // Support tickets (admin)
  useEffect(() => {
    if (!db || !isAdmin) {
      if (!isAdmin) setSupportTickets([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'supportTickets'), (snap) => {
      setSupportTickets(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
    });
    return () => unsub();
  }, [isAdmin]);

  // -------------------- ROUTING --------------------
  const routeToTab = (path) => {
    const clean = (path || '/').replace(/\/$/, '') || '/';
    if (clean === '/' || clean === '/home') return 'home';
    if (clean === '/admin') return 'admin';
    if (clean === '/shop' || clean.startsWith('/shop/')) return 'shop';
    if (clean === '/cart') return 'cart';
    if (clean === '/account/orders') return 'orders';
    if (clean === '/careers' || clean.startsWith('/careers/')) return 'applications';
    if (clean === '/about') return 'about';
    if (clean === '/contact') return 'contact';
    if (clean === '/faq') return 'faq';
    if (clean === '/privacy') return 'privacy';
    if (clean === '/terms') return 'terms';
    if (clean === '/account') return 'account';
    if (clean === '/blog' || clean.startsWith('/blog/')) return 'blog';
    if (clean === '/forum' || clean.startsWith('/forum/')) return 'forum';
    if (clean === '/compare') return 'compare';
    if (clean === '/wishlist') return 'wishlist';
    if (clean === '/shipping' || clean === '/returns') return 'shipping';
    return 'home';
  };

  const navigateTo = (tab, path) => {
    setActiveTab(tab);
    // Only clear product when leaving product detail (not when opening one)
    if (!path || !String(path).startsWith('/shop/')) {
      setSelectedProduct(null);
    }
    if (path && window.location.pathname !== path) window.history.pushState({}, '', path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname;
      setActiveTab(routeToTab(path));
      if (path.startsWith('/careers/')) {
        const slug = path.split('/')[2];
        const found = jobApplications.find((a) => a.slug === slug || a.id === slug);
        if (found) setSelectedApplication(found);
      } else if (path.startsWith('/shop/')) {
        const productSlug = path.split('/')[2];
        const foundProduct = products.find((p) => p.id === productSlug || p.slug === productSlug);
        if (foundProduct) {
          setSelectedProduct(foundProduct);
          if (foundProduct.options?.colors?.length) setSelectedColor(foundProduct.options.colors[0]);
        }
      } else if (path === '/shop' || path === '/') {
        setSelectedProduct(null);
      }
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [jobApplications.length, products.length]);

  // -------------------- HELPERS --------------------
  const saveUserDataToFirestore = async (updatedCart = cart, updatedOrders = orders, customName = userName) => {
    if (!db || !userId) return;
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', userId);
      await setDoc(
        userRef,
        {
          cart: updatedCart,
          orders: updatedOrders,
          displayName: customName,
          phone: profilePhone || '',
          company: profileCompany || '',
          bio: profileBio || '',
          location: profileLocation || '',
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Firestore save error:', e);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3500);
  };


  const handlePreorder = async (product = null) => {
    const em = (waitlistEmail || user?.email || '').trim();
    if (!em || !em.includes('@')) {
      showNotification('Enter your email to pre-order / join the list.', 'error');
      return;
    }
    setWaitlistSubmitting(true);
    try {
      if (db) {
        await addDoc(collection(db, 'artifacts', appId, 'preorders'), {
          email: em.toLowerCase(),
          productId: product?.id || null,
          productName: product?.name || 'General interest',
          color: selectedColor || null,
          createdAt: new Date().toISOString(),
          userId: user?.uid || null
        });
      }
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        em,
        em.split('@')[0],
        'PREORDER',
        'REGISTERED',
        `Hi,\n\nThanks for your interest in ${product?.name || 'Zortius hardware'}. You are on the pre-order list. We will contact you when ordering opens.\n\n— Zortius`
      );
      showNotification('You are on the pre-order list. We will email you at launch.');
      if (!user) setWaitlistEmail('');
    } catch (err) {
      console.error(err);
      showNotification('Could not register pre-order. Try again.', 'error');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    const em = (waitlistEmail || '').trim();
    if (!em || !em.includes('@')) {
      showNotification('Enter a valid email to join the waitlist.', 'error');
      return;
    }
    setWaitlistSubmitting(true);
    try {
      if (db) {
        await addDoc(collection(db, 'artifacts', appId, 'waitlist'), {
          email: em.toLowerCase(),
          createdAt: new Date().toISOString(),
          source: 'shop-banner'
        });
      }
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        em,
        em.split('@')[0],
        'WAITLIST',
        'JOINED',
        `Hi,\n\nYou have joined the Zortius launch waitlist. We will email you when orders open.\n\n— Zortius Team`
      );
      setWaitlistEmail('');
      showNotification('You are on the waitlist. We will notify you at launch.');
    } catch (err) {
      console.error(err);
      showNotification('Could not join waitlist. Try again.', 'error');
    } finally {
      setWaitlistSubmitting(false);
    }
  };


  // -------------------- EMAIL (EmailJS only) --------------------
  const sendActualEmail = async (templateId, toEmail, customerName, orderId, statusVal, messageDetails) => {
    const templateParams = {
      to_email: toEmail,
      name: customerName,
      order_id: orderId || 'N/A',
      status: statusVal ? String(statusVal).toUpperCase() : 'GENERAL',
      time: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
      subject: (() => {
        const oid = orderId != null ? String(orderId) : '';
        const st = statusVal != null ? String(statusVal) : '';
        if (oid === 'VERIFY' || oid.startsWith('VERIFY')) {
          // Put code in subject so users see it even in notification preview / spam folder
          const codeMatch = String(messageDetails || '').match(/\b(\d{6})\b/);
          const code = codeMatch ? codeMatch[1] : st;
          return `Zortius code ${code} — check inbox & junk`;
        }
        if (oid === 'SUPPORT-TICKET' || oid.startsWith('SUPPORT')) {
          return `Zortius support [${oid}] ${st}`.trim();
        }
        if (oid === 'SUPPORT-REPLY') {
          return `Re: your Zortius support request`;
        }
        if (oid === 'NEWSLETTER') {
          return `Welcome to Zortius updates`;
        }
        if (oid === 'PREORDER-UPDATE') {
          return `Zortius pre-order update`;
        }
        if (oid.startsWith('APPLICATION-')) {
          return `Zortius application – ${st || 'Received'}`;
        }
        if (oid && oid !== 'N/A') {
          return `Order #${oid} – Zortius`;
        }
        return 'Zortius — message';
      })(),
      message: messageDetails
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, templateId, templateParams, EMAILJS_PUBLIC_KEY);
      console.log(`[EmailJS] Success → ${toEmail}`);
    } catch (err) {
      console.error('EmailJS failed:', err);
    }
  };

  // -------------------- CONTACT --------------------
  const handleSendContactInquiry = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactInquiry) {
      showNotification('Please complete all contact fields.', 'error');
      return;
    }
    setIsSendingContact(true);
    const inquiryMessage = `Client Name: ${contactName}\nClient Email: ${contactEmail}\n\nMessage:\n${contactInquiry}`;
    await sendActualEmail(EMAILJS_CONTACT_TEMPLATE_ID, contactEmail, contactName, 'SUPPORT-INQUIRY', 'RECEIVED', inquiryMessage);
    setIsSendingContact(false);
    setContactModalOpen(false);
    setContactInquiry('');
    showNotification('Inquiry sent! A confirmation copy has been emailed to you.', 'success');
  };

  // -------------------- AUTH HANDLERS --------------------

  const generateVerifyCode = () => String(Math.floor(100000 + Math.random() * 900000));

  const otpSessionKey = (uid) => `zortius_otp_ok_${uid || 'x'}`;
  // Persist across refreshes until sign-out (or 30 days)
  const isOtpUnlocked = (uid) => {
    if (!uid) return false;
    try {
      const raw = localStorage.getItem(otpSessionKey(uid));
      if (!raw) return false;
      if (raw === '1') return true;
      const ts = Number(raw);
      if (!Number.isFinite(ts)) return false;
      return Date.now() - ts < 30 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };
  const setOtpUnlocked = (uid) => {
    try {
      localStorage.setItem(otpSessionKey(uid), String(Date.now()));
    } catch (_) {}
  };
  const clearOtpUnlocked = (uid) => {
    try {
      if (uid) {
        localStorage.removeItem(otpSessionKey(uid));
        sessionStorage.removeItem(otpSessionKey(uid));
        sessionStorage.removeItem(`zortius_otp_sent_${uid}`);
      } else {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('zortius_otp_ok_')) localStorage.removeItem(k);
        });
      }
    } catch (_) {}
  };

  const sendVerifyCodeEmail = async (toEmail, code, name) => {
    await sendActualEmail(
      EMAILJS_CONTACT_TEMPLATE_ID,
      toEmail,
      name || toEmail.split('@')[0],
      'VERIFY',
      'CODE',
      `Zortius sign-in verification\n\nYour one-time code: ${code}\n\nEnter this code on https://zortius.com to finish signing in.\n\nExpires in 30 minutes.\n\nTip: If you do not see this email within a minute, check Junk / Spam / Promotions.\n\nIf you did not request this, ignore this message.\n\n— Zortius\nhttps://zortius.com`
    );
  };

  const saveVerifyCode = async (em, code, uid) => {
    if (!db) return;
    await setDoc(doc(db, 'artifacts', appId, 'emailCodes', em.toLowerCase()), {
      code,
      uid: uid || null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
  };

  const markEmailVerified = async (em, uid) => {
    if (!db || !uid) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', uid), { emailVerified: true, email: em.toLowerCase() }, { merge: true });
    setEmailVerifiedMap((m) => ({ ...m, [em.toLowerCase()]: true }));
  };

  const isEmailVerifiedUser = async (uid, em) => {
    if (!db || !uid) return false;
    // Google accounts are trusted
    return new Promise((resolve) => {
      const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', uid), (snap) => {
        unsub();
        const data = snap.data() || {};
        resolve(!!data.emailVerified);
      }, () => resolve(false));
    });
  };


  const startLoginOtpGate = async (currentUser) => {
    if (!currentUser?.email) return;
    const em = currentUser.email.toLowerCase().trim();
    if (isOtpUnlocked(currentUser.uid)) {
      setOtpGateActive(false);
      setVerifyMode(false);
      return;
    }
    setPendingVerifyEmail(em);
    setVerifyMode(true);
    setOtpGateActive(true);
    setVerifyCode('');
    setProfileModalOpen(true);
    setAuthError('');
    // Prevent duplicate sends for same user in a short window
    const sendKey = `zortius_otp_sent_${currentUser.uid}`;
    try {
      const last = sessionStorage.getItem(sendKey);
      if (last && Date.now() - Number(last) < 45000) return;
      sessionStorage.setItem(sendKey, String(Date.now()));
    } catch (_) {}
    if (otpSending) return;
    setOtpSending(true);
    try {
      const code = generateVerifyCode();
      await saveVerifyCode(em, code, currentUser.uid);
      await sendVerifyCodeEmail(em, code, currentUser.displayName || em.split('@')[0]);
      showNotification('Enter the 6-digit code we emailed you to finish signing in.');
    } catch (err) {
      console.error(err);
      setAuthError('Could not send code. Tap Resend or use Contact support.');
    } finally {
      setOtpSending(false);
    }
  };


  const saveStoreSettings = async (patch) => {
    if (!db || !isFullAdmin) return;
    const next = { ...storeSettings, ...patch, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'artifacts', appId, 'public_data', 'settings'), next, { merge: true });
    setStoreSettings(next);
    showNotification('Store settings saved.');
  };

  const handleNewsletterSignup = async (e) => {
    e?.preventDefault?.();
    const em = (newsletterEmail || user?.email || '').trim().toLowerCase();
    if (!em || !em.includes('@')) {
      showNotification('Enter a valid email.', 'error');
      return;
    }
    setNewsletterBusy(true);
    try {
      if (db) {
        await addDoc(collection(db, 'artifacts', appId, 'newsletter'), {
          email: em,
          source: 'website',
          userId: user?.uid || null,
          createdAt: new Date().toISOString()
        });
      }
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        em,
        em.split('@')[0],
        'NEWSLETTER',
        'WELCOME',
        `Welcome to the Zortius list.\n\nYou will get product launches, pre-order windows, and engineering notes.\n\nUnsubscribe anytime by replying STOP.\n\n— Zortius\nhttps://zortius.com`
      );
      setNewsletterEmail('');
      showNotification('You are on the list. Check inbox & junk for a welcome note.');
    } catch (err) {
      console.error(err);
      showNotification('Could not join list. Try again.', 'error');
    } finally {
      setNewsletterBusy(false);
    }
  };

  const exportNewsletterCsv = () => {
    const rows = [['Email', 'Source', 'Date']];
    newsletters.forEach((r) => {
      rows.push([r.email || '', r.source || '', r.createdAt ? new Date(r.createdAt).toISOString() : '']);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zortius-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${newsletters.length} subscribers.`);
  };

  const emailAllPreorders = async () => {
    if (!isFullAdmin || preorders.length === 0) return;
    if (!window.confirm(`Email all ${preorders.length} pre-order contacts?`)) return;
    let ok = 0;
    for (const row of preorders) {
      if (!row.email) continue;
      try {
        await sendActualEmail(
          EMAILJS_CONTACT_TEMPLATE_ID,
          row.email,
          row.email.split('@')[0],
          'PREORDER-UPDATE',
          'UPDATE',
          `Hi,\n\nThanks for your interest in ${row.productName || 'Zortius'}.\n\n${storeSettings.takingOrders ? 'Orders are now open at https://zortius.com/shop' : 'We will notify you when checkout opens at https://zortius.com'}\n\n— Zortius`
        );
        ok += 1;
        await new Promise((r) => setTimeout(r, 400));
      } catch (_) {}
    }
    showNotification(`Sent ${ok} pre-order update emails.`);
  };

  const exportPreordersCsv = () => {
    const rows = [['Email', 'Product', 'Colour', 'Date']];
    preorders.forEach((r) => {
      rows.push([
        r.email || '',
        r.productName || 'General',
        r.color || '',
        r.createdAt ? new Date(r.createdAt).toISOString() : ''
      ]);
    });
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zortius-preorders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${preorders.length} pre-order rows.`);
  };

  const sendTicketReply = async (ticket) => {
    const body = (ticketReply[ticket.id] || '').trim();
    if (!body) {
      showNotification('Write a reply first.', 'error');
      return;
    }
    try {
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        ticket.email,
        ticket.name || 'Customer',
        'SUPPORT-REPLY',
        ticket.id?.slice(0, 8) || 'TICKET',
        `Hi ${ticket.name || 'there'},\n\n${body}\n\n— Zortius Support\nhttps://zortius.com`
      );
      if (db) {
        await updateDoc(doc(db, 'artifacts', appId, 'supportTickets', ticket.id), {
          status: 'Replied',
          lastReply: body,
          repliedAt: new Date().toISOString()
        });
      }
      setTicketReply((m) => ({ ...m, [ticket.id]: '' }));
      showNotification('Reply emailed to customer.');
    } catch (err) {
      console.error(err);
      showNotification('Failed to send reply.', 'error');
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      if (auth) {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const name = email.split('@')[0];
        setUserName(name);
        await saveUserDataToFirestore(cart, orders, name);
        // OTP gate via onAuthStateChanged / applyUser — must enter code before access
        showNotification('Account created. Enter the code we email you to finish.');
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    const em = (pendingVerifyEmail || email || user?.email || '').trim().toLowerCase();
    const entered = (verifyCode || '').trim();
    if (!em || entered.length < 6) {
      setAuthError('Enter the 6-digit code from your email.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      if (!db) throw new Error('Database not ready');
      const snap = await new Promise((resolve, reject) => {
        const unsub = onSnapshot(doc(db, 'artifacts', appId, 'emailCodes', em), (s) => {
          unsub();
          resolve(s);
        }, reject);
      });
      if (!snap.exists()) {
        setAuthError('No code found. Use Resend code.');
        return;
      }
      const data = snap.data();
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        setAuthError('Code expired. Resend a new one.');
        return;
      }
      if (String(data.code) !== entered) {
        setAuthError('Incorrect code. Check the email and try again.');
        return;
      }
      const uid = user?.uid || data.uid;
      await markEmailVerified(em, uid);
      await deleteDoc(doc(db, 'artifacts', appId, 'emailCodes', em)).catch(() => {});
      setOtpUnlocked(uid);
      setOtpGateActive(false);
      setVerifyMode(false);
      setVerifyCode('');
      setPendingVerifyEmail('');
      setProfileModalOpen(false);
      setEmail('');
      setPassword('');
      // Unlock admin roles now
      if (user || uid) {
        const u = user;
        const emailAddr = (em || u?.email || '').toLowerCase().trim();
        setIsAdmin(emailAddr === ADMIN_EMAIL.toLowerCase() || emailAddr === LIMITED_ADMIN_EMAIL.toLowerCase());
        setIsFullAdmin(emailAddr === ADMIN_EMAIL.toLowerCase());
      }
      showNotification('Verified. You are signed in.');
    } catch (err) {
      setAuthError(err.message || 'Verification failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendVerifyCode = async () => {
    const em = (pendingVerifyEmail || email || user?.email || '').trim().toLowerCase();
    if (!em) {
      setAuthError('Enter your email first.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const code = generateVerifyCode();
      await saveVerifyCode(em, code, user?.uid);
      await sendVerifyCodeEmail(em, code, em.split('@')[0]);
      showNotification('New code sent. Check inbox and spam.');
    } catch (err) {
      setAuthError(err.message || 'Could not resend code.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      if (auth) {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email, password);
        // applyUser forces email code before access
        showNotification('Check your email for the verification code.');
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const narrow = window.innerWidth > 0 && window.innerWidth < 768;
    return mobileUA || coarse || narrow;
  };

    const handleGoogleSignIn = async () => {
    setAuthSubmitting(true);
    setAuthError('');
    try {
      if (!auth) {
        setAuthError('Auth not ready. Refresh the page.');
        setAuthSubmitting(false);
        return;
      }
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('email');
      provider.addScope('profile');

      // Prefer popup everywhere (including phone browsers that support it); redirect fallback
      try {
        const result = await signInWithPopup(auth, provider);
        if (result?.user) {
          // onAuthStateChanged → applyUser → OTP required before full access
          showNotification('Google OK. Enter the email code to finish signing in.');
        }
      } catch (popupErr) {
        const code = popupErr?.code || '';
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/operation-not-supported-in-this-environment'
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';
      const msg = (err?.message || '').replace('Firebase: ', '');
      if (code === 'auth/unauthorized-domain') {
        setAuthError('Add zortius.com and www.zortius.com in Firebase → Authentication → Settings → Authorized domains.');
      } else {
        setAuthError(msg || 'Google sign-in failed.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const em = (email || '').trim();
    if (!em || !em.includes('@')) {
      setAuthError('Enter the email for your account.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      if (!auth) throw new Error('Auth not ready');
      await sendPasswordResetEmail(auth, em);
      setForgotSent(true);
      showNotification('Password reset email sent. Check your inbox.');
    } catch (err) {
      const msg = (err?.message || '').replace('Firebase: ', '');
      setAuthError(msg || 'Could not send reset email.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth) {
        clearOtpUnlocked(user?.uid); setOtpGateActive(false); setVerifyMode(false); await signOut(auth);
        setCart([]);
        setOrders([]);
        setActiveTab('shop');
        showNotification('Signed out successfully.');
      }
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  // -------------------- CART --------------------

  const openProduct = (product) => {
    setSelectedProduct(product);
    setProductGalleryIndex(0);
    if (product?.options?.colors?.length) setSelectedColor(product.options.colors[0]);
    else setSelectedColor('Standard');
    setActiveTab('shop');
    const path = `/shop/${product.id}`;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product) => {
    const color = selectedColor || product.options?.colors?.[0] || 'Standard';
    const customItem = { ...product, selectedColor: color };
    const existing = cart.find((item) => item.id === product.id && item.selectedColor === color);
    let updated;
    if (existing) {
      updated = cart.map((item) =>
        item.id === product.id && item.selectedColor === color ? { ...item, qty: item.qty + 1 } : item
      );
    } else {
      updated = [...cart, { ...customItem, qty: 1 }];
    }
    setCart(updated);
    saveUserDataToFirestore(updated);
    showNotification(`Added ${product.name} (${color}) to your basket.`);
  };

  const updateCartQty = (productId, color, delta) => {
    const updated = cart
      .map((item) => {
        if (item.id === productId && item.selectedColor === color) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
    setCart(updated);
    saveUserDataToFirestore(updated);
  };

  const removeFromCart = (productId, color) => {
    const updated = cart.filter((item) => !(item.id === productId && item.selectedColor === color));
    setCart(updated);
    saveUserDataToFirestore(updated);
    showNotification('Item removed from basket.', 'info');
  };

  const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * Number(item.qty || 1), 0);

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.percent) return (subtotal * appliedDiscount.percent) / 100;
    if (appliedDiscount.fixed) return Math.min(subtotal, appliedDiscount.fixed);
    return 0;
  };

  const grandTotal = Math.max(0, subtotal - calculateDiscount());

  const handleApplyDiscount = () => {
    setDiscountError('');
    const match = discounts.find((d) => d.code.toUpperCase() === appliedCode.trim().toUpperCase() && d.active);
    if (match) {
      setAppliedDiscount(match);
      showNotification(`Promo code ${match.code} applied!`);
    } else {
      setDiscountError('Invalid or expired discount code.');
      setAppliedDiscount(null);
    }
  };

  // -------------------- CHECKOUT / STRIPE --------------------
  const formatShippingAddress = () => {
    return [
      shipFullName,
      shipLine1,
      shipLine2,
      `${shipCity} ${shipPostcode}`.trim(),
      shipCountry,
      shipPhone ? `Tel: ${shipPhone}` : ''
    ]
      .filter(Boolean)
      .join(', ');
  };

  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;
    if (!user) {
      showNotification('Please log in or create an account to complete your purchase.', 'error');
      setAuthMode('login');
      setProfileModalOpen(true);
      return;
    }
    setCheckoutModalOpen(true);
  };

  // Real Stripe Checkout Session
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    showNotification("You can't buy yet — wait. Checkout is not available at the moment.", 'error');
    return;
    // purchases disabled below
    if (!shipFullName || !shipLine1 || !shipCity || !shipPostcode || !shipCountry) {
      showNotification('Please fill in all required shipping fields.', 'error');
      return;
    }
    setIsProcessingPayment(true);

    const shippingAddress = formatShippingAddress();
    const shippingObj = {
      fullName: shipFullName,
      line1: shipLine1,
      line2: shipLine2,
      city: shipCity,
      postcode: shipPostcode,
      country: shipCountry,
      phone: shipPhone
    };

    try {
      // Try real Stripe Checkout first
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerEmail: user.email,
          shippingAddress,
          shipping: shippingObj,
          discountCode: appliedDiscount?.code || null,
          discountAmount: calculateDiscount(),
          successUrl: `${window.location.origin}/account/orders?paid=1`,
          cancelUrl: `${window.location.origin}/cart`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Save pending order context locally then redirect to Stripe
          window.location.href = data.url;
          return;
        }
      }

      // Fallback: demo order (if Stripe API not ready yet)
      const orderId = 'ZRT-PAY-' + Math.floor(100000 + Math.random() * 900000);
      const newOrder = {
        id: orderId,
        customerEmail: user.email,
        customerName: userName,
        shippingAddress,
        shipping: shippingObj,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: [...cart],
        subtotal,
        discountAmount: calculateDiscount(),
        total: grandTotal,
        status: 'Processing',
        paymentMethod: 'Stripe Card Payment (demo fallback)'
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      setCart([]);
      setAppliedDiscount(null);
      setAppliedCode('');
      saveUserDataToFirestore([], updatedOrders);

      if (db) {
        try {
          const orderRef = doc(db, 'artifacts', appId, 'orders', orderId);
          await setDoc(orderRef, newOrder, { merge: true });
        } catch (err) {
          console.error('Error saving order:', err);
        }
      }

      const receiptMessage = `Order Reference ID: ${orderId}\nCustomer Name: ${userName}\nShipping Address: ${shippingAddress}\nTotal Paid: £${grandTotal.toFixed(2)}\nStatus: Processing\n\nPurchased Items:\n${cart
        .map((i) => `- ${i.name} (Qty: ${i.qty}) [Color: ${i.selectedColor || 'Standard'}] - £${(i.price * i.qty).toFixed(2)}`)
        .join('\n')}`;

      await sendActualEmail(EMAILJS_ORDER_TEMPLATE_ID, user.email, userName, orderId, 'Processing', receiptMessage);

      setCheckoutModalOpen(false);
      showNotification(`Order ${orderId} created. (Demo mode – connect Stripe API for live payments)`, 'info');
      setActiveTab('orders');
    } catch (err) {
      console.error(err);
      showNotification('Payment could not be started. Please try again.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // -------------------- AI --------------------
  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiThinking(true);
    setTimeout(() => {
      const matched =
        products.find(
          (p) =>
            p.name.toLowerCase().includes(aiQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(aiQuery.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(aiQuery.toLowerCase())
        ) || products[0];
      setAiResponse({
        recommendation: matched,
        explanation: `Based on your requirements ("${aiQuery}"), the ${matched.name} delivers maximum throughput and zero-throttle reliability for your specific workflow.`
      });
      setIsAiThinking(false);
    }, 900);
  };

  // Support assistant (AI when configured) (no paid API)
  const getBotReply = (raw) => {
    const q = (raw || '').toLowerCase().trim();
    if (!q) return { text: 'Type a question about products, orders, careers, or accounts.', escalate: false };

    const wantsHuman = /\b(human|agent|staff|person|manager|real person|talk to|speak to|support ticket|complaint)\b/.test(q);
    if (wantsHuman) {
      return {
        text: 'I can create a support ticket for the team. Confirm your email below (or we use your signed-in email) and I will notify admin by email.',
        escalate: true
      };
    }
    if (/pre-?order|waitlist|when.*order|taking orders|buy now|checkout|stripe|payment/.test(q)) {
      return {
        text: 'Most Zortius systems are on pre-order interest right now. Join the list from Shop or a product page — we email you when ordering opens. Payments are not open yet.',
        escalate: false
      };
    }
    if (/shipping|delivery|ship|uk|international/.test(q)) {
      return {
        text: 'Shipping details will be confirmed at launch. We plan UK-first fulfilment with tracked delivery. Join pre-order to get launch updates.',
        escalate: false
      };
    }
    if (/career|job|apply|application|hire|intern/.test(q)) {
      return {
        text: 'Open roles are under Careers. Submit an application online — you get email confirmation, then Accept/Deny updates from the team.',
        escalate: false
      };
    }
    if (/password|login|sign in|google|account|forgot/.test(q)) {
      return {
        text: 'Use Sign in → Forgot password for a reset email. Google sign-in works best in the same browser (not private mode). Authorized domain must include zortius.vercel.app.',
        escalate: false
      };
    }
    if (/review|rating/.test(q)) {
      return {
        text: 'Only verified buyers with an order marked Delivered can leave a product review.',
        escalate: false
      };
    }
    if (/forum|community|discuss/.test(q)) {
      return { text: 'Join the Forum (login required to post). Read threads anytime.', escalate: false };
    }
    if (/blog|media|news|article/.test(q)) {
      return { text: 'Official updates are on Media. Admins publish posts; likes/comments depend on post settings.', escalate: false };
    }
    if (/contact|email|help@|support@/.test(q)) {
      return {
        text: `Support email: ${SUPPORT_EMAIL}. You can also open Contact or escalate here for a ticket in the admin panel.`,
        escalate: false
      };
    }
    // product match
    const matched = products.find(
      (p) =>
        q.includes((p.name || '').toLowerCase().split(' ').slice(-1)[0]) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
    if (matched) {
      const mode = matched.isPreorder !== false ? 'Pre-order interest' : 'Standard order';
      return {
        text: `${matched.name} — £${Number(matched.price).toLocaleString('en-GB')} · ${matched.category}. Mode: ${mode}. ${matched.description?.slice(0, 160) || ''}… Open it in Shop for colours, gallery and specs.`,
        escalate: false
      };
    }
    if (/spec|compare|workstation|monitor|keyboard|desktop/.test(q)) {
      return {
        text: 'See Shop for full specs, or open Compare for a side-by-side view. Tell me a product name for a short summary.',
        escalate: false
      };
    }
    return {
      text: "I'm not sure. Try: pre-orders, a product name, careers, password, or say 'human' to email the team.",
      escalate: false
    };
  };

  const handleChatSend = async (e) => {
    e?.preventDefault?.();
    const text = (chatInput || '').trim();
    if (!text || chatSending) return;
    setChatSending(true);
    setChatMessages((m) => [...m, { role: 'user', text }]);
    setChatInput('');
    let botText = '';
    let escalate = false;
    try {
      const productCtx = products
        .slice(0, 12)
        .map((p) => `${p.name} (£${p.price}) ${p.isPreorder !== false ? '[pre-order]' : ''} — ${(p.description || '').slice(0, 80)}`)
        .join('\n');
      const context = `Store mode: ${storeSettings.statusLabel}. Announcement: ${storeSettings.announcement}. Taking orders: ${storeSettings.takingOrders}.\nProducts:\n${productCtx}`;
      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context })
      });
      const data = await res.json().catch(() => ({}));
      if (data.text && !data.fallback) {
        botText = data.text;
      } else {
        const reply = getBotReply(text);
        botText = reply.text + (data.error ? `\n\n(AI note: ${data.error})` : '');
        escalate = reply.escalate;
      }
    } catch (_) {
      const reply = getBotReply(text);
      botText = reply.text;
      escalate = reply.escalate;
    }
    if (/\b(human|agent|ticket|complaint|manager)\b/i.test(text)) escalate = true;
    setChatMessages((m) => [...m, { role: 'bot', text: botText, escalate }]);
    setChatSending(false);
  };

  const handleEscalateTicket = async () => {
    const em = (escalateEmail || user?.email || '').trim();
    const nm = (escalateName || userName || em.split('@')[0] || 'Guest').trim();
    if (!em || !em.includes('@')) {
      showNotification('Enter a valid email so we can reach you.', 'error');
      return;
    }
    const lastUser = [...chatMessages].reverse().find((m) => m.role === 'user');
    const summary = lastUser?.text || 'Support request from chatbot';
    try {
      if (db) {
        await addDoc(collection(db, 'artifacts', appId, 'supportTickets'), {
          email: em.toLowerCase(),
          name: nm,
          message: summary,
          transcript: chatMessages.slice(-12),
          status: 'Open',
          source: 'chatbot',
          page: window.location.pathname,
          createdAt: new Date().toISOString(),
          userId: user?.uid || null
        });
      }
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        SUPPORT_EMAIL,
        nm,
        'SUPPORT-TICKET',
        'OPEN',
        `New support ticket from ${nm} <${em}>\n\nMessage:\n${summary}\n\nPage: ${window.location.pathname}`
      );
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        em,
        nm,
        'SUPPORT-TICKET',
        'RECEIVED',
        `Hi ${nm},\n\nWe received your support request and the Zortius team will reply by email.\n\nYour message:\n${summary}\n\n— Zortius Support`
      );
      setChatMessages((m) => [
        ...m,
        { role: 'bot', text: 'Ticket created. The team has been emailed and you should get a confirmation. Check spam if needed.' }
      ]);
      showNotification('Support ticket sent to admin.');
      setEscalateEmail('');
    } catch (err) {
      console.error(err);
      showNotification('Could not create ticket. Try Contact form.', 'error');
    }
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!db || !isAdmin || !blogTitle.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'blogPosts'), {
      title: blogTitle.trim(),
      body: blogBody.trim(),
      allowComments: blogAllowComments,
      allowLikes: blogAllowLikes,
      likes: [],
      comments: [],
      authorEmail: user?.email || ADMIN_EMAIL,
      authorName: userName || 'Zortius',
      createdAt: new Date().toISOString()
    });
    setBlogTitle('');
    setBlogBody('');
    showNotification('Media post published.');
  };

  const handleLikeBlog = async (post) => {
    if (!user || !db || post.allowLikes === false) return;
    const likes = Array.isArray(post.likes) ? [...post.likes] : [];
    const uid = user.uid;
    const idx = likes.indexOf(uid);
    if (idx >= 0) likes.splice(idx, 1);
    else likes.push(uid);
    await updateDoc(doc(db, 'artifacts', appId, 'blogPosts', post.id), { likes });
  };

  const handleBlogComment = async (post) => {
    if (!user || !db || !blogComment.trim() || post.allowComments === false) return;
    const comments = Array.isArray(post.comments) ? [...post.comments] : [];
    comments.push({
      id: Date.now().toString(36),
      userId: user.uid,
      userName: userName || user.email,
      text: blogComment.trim(),
      createdAt: new Date().toISOString()
    });
    await updateDoc(doc(db, 'artifacts', appId, 'blogPosts', post.id), { comments });
    setBlogComment('');
    showNotification('Comment added.');
  };

  const handleDeleteBlog = async (id) => {
    if (!db || !isAdmin) return;
    if (!window.confirm('Delete this media post?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'blogPosts', id));
    setSelectedBlog(null);
    showNotification('Post deleted.');
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification('Sign in to post on the forum.', 'error');
      setProfileModalOpen(true);
      return;
    }
    if (!db || !forumTitle.trim() || !forumBody.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'forumThreads'), {
      title: forumTitle.trim(),
      body: forumBody.trim(),
      authorId: user.uid,
      authorName: userName || user.email,
      authorEmail: user.email,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setForumTitle('');
    setForumBody('');
    showNotification('Thread posted.');
  };

  const handleForumReply = async (thread) => {
    if (!user) {
      showNotification('Sign in to reply.', 'error');
      setProfileModalOpen(true);
      return;
    }
    if (!db || !forumReply.trim()) return;
    const replies = Array.isArray(thread.replies) ? [...thread.replies] : [];
    replies.push({
      id: Date.now().toString(36),
      userId: user.uid,
      userName: userName || user.email,
      text: forumReply.trim(),
      createdAt: new Date().toISOString()
    });
    await updateDoc(doc(db, 'artifacts', appId, 'forumThreads', thread.id), {
      replies,
      updatedAt: new Date().toISOString()
    });
    setForumReply('');
    showNotification('Reply posted.');
  };

  const handleDeleteThread = async (id) => {
    if (!db || !isAdmin) return;
    if (!window.confirm('Delete this thread?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'forumThreads', id));
    setSelectedThread(null);
    showNotification('Thread deleted.');
  };

  const handleTicketStatus = async (id, status) => {
    if (!db || !isAdmin) return;
    await updateDoc(doc(db, 'artifacts', appId, 'supportTickets', id), { status });
    showNotification(`Ticket marked ${status}.`);
  };

  // -------------------- REVIEWS (only after Delivered) --------------------
  const hasUserReceivedProduct = (productId) => {
    if (!Array.isArray(orders)) return false;
    return orders.some(
      (order) =>
        order.status === 'Delivered' &&
        Array.isArray(order.items) &&
        order.items.some((item) => item.id === productId)
    );
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!user) {
      showNotification('Please sign in to leave a review.', 'error');
      return;
    }
    if (!hasUserReceivedProduct(selectedProduct.id)) {
      showNotification('Reviews can only be submitted after your order status is Delivered.', 'error');
      return;
    }
    if (!newReviewComment.trim()) {
      showNotification('Please enter review comments.', 'error');
      return;
    }

    const reviewObj = {
      id: Math.random().toString(36).substring(7),
      userId: userId || 'anon',
      userName: userName || 'Verified Engineer',
      rating: Number(newReviewRating),
      comment: newReviewComment.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      verified: true
    };

    const productReviews = reviews[selectedProduct.id] || [];
    const updatedReviewsMap = { ...reviews, [selectedProduct.id]: [reviewObj, ...productReviews] };
    setReviews(updatedReviewsMap);
    setNewReviewComment('');
    showNotification('Verified review submitted successfully.');

    if (db) {
      try {
        const reviewsRef = doc(db, 'artifacts', appId, 'public_data', 'reviews');
        await setDoc(reviewsRef, { map: updatedReviewsMap }, { merge: true });
      } catch (e) {
        console.error('Error saving review:', e);
      }
    }
  };

  // -------------------- APPLICATIONS --------------------
  const slugify = (value) =>
    (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!db || !isAdmin || !newSectionName.trim()) return;
    const name = newSectionName.trim();
    if (applicationSections.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      showNotification('That application section already exists.', 'error');
      return;
    }
    await addDoc(collection(db, 'artifacts', appId, 'applicationSections'), {
      name,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || null
    });
    setNewSectionName('');
    showNotification('Application section created.');
  };

  const handleDeleteSection = async (sectionId, sectionName) => {
    if (!db || !isAdmin) return;
    if (!window.confirm(`Delete section "${sectionName}"? Applications in this section will remain but the section label may be empty.`)) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'applicationSections', sectionId));
      showNotification('Section deleted.');
    } catch (err) {
      console.error(err);
      showNotification('Could not delete section.', 'error');
    }
  };

  const handleDeleteApplication = async (applicationId, title) => {
    if (!db || !isAdmin) return;
    if (!window.confirm(`Delete application form "${title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'jobApplications', applicationId));
      if (editingApplicationId === applicationId) {
        setEditingApplicationId(null);
        setAppTitle('');
        setAppSection('');
        setAppDescription('');
        setAppQuestions([]);
      }
      showNotification('Application form deleted.');
    } catch (err) {
      console.error(err);
      showNotification('Could not delete application.', 'error');
    }
  };



  const addApplicationQuestion = () => {
    if (!questionDraft.trim()) {
      showNotification('Enter a question first.', 'error');
      return;
    }
    setAppQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        question: questionDraft.trim(),
        type: questionType,
        marks: Math.max(0, Math.min(100, Number(questionMarks) || 0)),
        required: questionRequired
      }
    ]);
    setQuestionDraft('');
    showNotification('Question added to your form.');
  };

  const generateApplicationQuestions = async () => {
    if (!appTitle.trim()) {
      showNotification('Add an application title first so the AI knows the role.', 'error');
      return;
    }
    setAiGeneratingQuestions(true);
    try {
      const endpoint = import.meta.env?.VITE_AI_QUESTIONS_ENDPOINT;
      if (!endpoint) {
        setQuestionDraft(`Why are you interested in the ${appTitle} role at Zortius, and what would you contribute?`);
        setQuestionType('long');
        setQuestionMarks('10');
        showNotification('Draft question prepared. Connect a secure AI endpoint for generated question sets.', 'info');
      } else {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: appTitle, section: appSection, description: appDescription })
        });
        if (!response.ok) throw new Error('AI question service returned an error.');
        const data = await response.json();
        const questions = Array.isArray(data.questions) ? data.questions : [];
        if (!questions.length) throw new Error('The AI service returned no questions.');
        setAppQuestions((prev) => [
          ...prev,
          ...questions
            .map((q, i) => ({
              id: `ai-${Date.now()}-${i}`,
              question: String(q.question || q.text || ''),
              type: ['short', 'long', 'email', 'number'].includes(q.type) ? q.type : 'long',
              marks: Math.max(0, Number(q.marks) || 5),
              required: q.required !== false,
              markingCriteria: q.markingCriteria || ''
            }))
            .filter((q) => q.question)
        ]);
        showNotification(`${questions.length} AI questions added to the form.`);
      }
    } catch (err) {
      showNotification(err.message || 'Could not generate questions.', 'error');
    } finally {
      setAiGeneratingQuestions(false);
    }
  };

  const handleSaveApplication = async (e) => {
    e.preventDefault();
    if (!db || !isAdmin) return;
    if (!appTitle.trim() || !appSection || !appQuestions.length) {
      showNotification('Add a title, section and at least one question.', 'error');
      return;
    }
    const slug = slugify(appTitle);
    const payload = {
      title: appTitle.trim(),
      slug,
      section: appSection,
      description: appDescription.trim(),
      questions: appQuestions,
      published: true,
      updatedAt: new Date().toISOString(),
      createdBy: user?.uid || null
    };
    if (editingApplicationId) {
      await setDoc(doc(db, 'artifacts', appId, 'jobApplications', editingApplicationId), payload, { merge: true });
      showNotification('Application form updated and published.');
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'jobApplications'), { ...payload, createdAt: new Date().toISOString() });
      showNotification('Application published on the website.');
    }
    setEditingApplicationId(null);
    setAppTitle('');
    setAppSection('');
    setAppDescription('');
    setAppQuestions([]);
  };

  const markSubmission = (submission) => {
    const questions = submission.questions || [];
    const answers = submission.answers || {};
    let earned = 0;
    let possible = 0;
    const breakdown = questions.map((q) => {
      const max = Number(q.marks) || 0;
      const answer = String(answers[q.id] || '').trim();
      possible += max;
      let score = 0;
      if (answer) {
        const words = answer.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
        const unique = new Set(words);
        score = max ? Math.min(max, Math.round(max * Math.min(1, unique.size / 12) * Math.min(1, answer.length / 80))) : 0;
      }
      earned += score;
      return {
        questionId: q.id,
        score,
        max,
        note: answer ? 'Preliminary completeness/length indicator; staff should assess relevance and quality.' : 'No answer supplied.'
      };
    });
    return { score: earned, maxScore: possible, breakdown, markedAt: new Date().toISOString(), markingType: 'preliminary-rule-based' };
  };

  const getApplicationMark = async (submission) => {
    const endpoint = import.meta.env?.VITE_AI_MARKING_ENDPOINT;
    if (!endpoint) return markSubmission(submission);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationTitle: submission.applicationTitle,
        section: submission.section,
        questions: submission.questions,
        answers: submission.answers
      })
    });
    if (!response.ok) throw new Error('AI marking service returned an error.');
    const data = await response.json();
    if (!Array.isArray(data.breakdown) || typeof data.score !== 'number' || typeof data.maxScore !== 'number') {
      throw new Error('AI marking service returned an invalid marking result.');
    }
    return { ...data, markedAt: new Date().toISOString(), markingType: 'ai-assisted', needsHumanReview: true };
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification('Please sign in before submitting an application.', 'error');
      setAuthMode('login');
      setProfileModalOpen(true);
      return;
    }
    if (!selectedApplication || !db) {
      showNotification('This application is temporarily unavailable.', 'error');
      return;
    }
    const missing = (selectedApplication.questions || []).find((q) => q.required && !String(applicationAnswers[q.id] || '').trim());
    if (missing) {
      showNotification(`Please answer: ${missing.question}`, 'error');
      return;
    }
    setApplicationSubmitting(true);
    try {
      const submission = {
        applicationId: selectedApplication.id,
        applicationTitle: selectedApplication.title,
        section: selectedApplication.section,
        applicantUid: user.uid,
        applicantName: userName || user.displayName || user.email?.split('@')[0] || 'Applicant',
        applicantEmail: user.email,
        answers: applicationAnswers,
        questions: selectedApplication.questions || [],
        status: 'Pending',
        submittedAt: new Date().toISOString()
      };
      const preliminaryMark = await getApplicationMark(submission);
      const ref = await addDoc(collection(db, 'artifacts', appId, 'applicationSubmissions'), { ...submission, preliminaryMark });
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        user.email,
        submission.applicantName,
        `APPLICATION-${ref.id}`,
        'RECEIVED',
        `Hi ${submission.applicantName},\n\nWe have received your application for ${submission.applicationTitle} at Zortius. Our team will review it and contact you when a decision has been made.\n\nReference: ${ref.id}\n\nPlease do not reply to this automated confirmation.`
      );
      setApplicationAnswers({});
      setSelectedApplication(null);
      navigateTo('applications', '/careers');
      showNotification('Application submitted. A confirmation email has been requested.');
    } catch (err) {
      console.error(err);
      showNotification('Your application could not be submitted. Please try again.', 'error');
    } finally {
      setApplicationSubmitting(false);
    }
  };

  const handleApplicationDecision = async (submission, decision) => {
    if (!db || !isAdmin || !['Accepted', 'Denied'].includes(decision)) return;
    const toEmail = submission.applicantEmail || submission.email;
    if (!toEmail) {
      showNotification('No applicant email found on this submission.', 'error');
      return;
    }
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'applicationSubmissions', submission.id), {
        status: decision,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.uid || null
      });
      const message =
        decision === 'Accepted'
          ? `Hi ${submission.applicantName || 'there'},\n\nThank you for applying for ${submission.applicationTitle} at Zortius. Your application has been accepted. We will contact you further with the next steps.\n\nKind regards,\nZortius Team`
          : `Hi ${submission.applicantName || 'there'},\n\nThank you for taking the time to apply for ${submission.applicationTitle} at Zortius. Unfortunately, we will not be progressing your application at this time. We appreciate your interest and wish you the best.\n\nKind regards,\nZortius Team`;
      await sendActualEmail(
        EMAILJS_CONTACT_TEMPLATE_ID,
        toEmail,
        submission.applicantName || 'Applicant',
        `APPLICATION-${submission.id}`,
        decision.toUpperCase(),
        message
      );
      showNotification(`${decision} decision saved and email sent to ${toEmail}.`);
    } catch (err) {
      console.error(err);
      showNotification('Could not save the decision or send email. Check console.', 'error');
    }
  };

  // -------------------- ADMIN PRODUCT / DISCOUNT --------------------
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!db || !isAdmin) return;
    const colorList = (prodColorOption || 'Default')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const imageList = (prodImages || '')
      .split(/[\n,]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (prodImage && !imageList.includes(prodImage)) imageList.unshift(prodImage);
    const payload = {
      name: prodName,
      price: parseFloat(prodPrice),
      category: prodCategory,
      image: imageList[0] || prodImage || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80',
      images: imageList.length ? imageList : [prodImage || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80'],
      videoUrl: (prodVideo || '').trim() || null,
      description: prodDesc || 'High-performance computing component.',
      rating: 5.0,
      reviewsCount: 1,
      specs: ['ZORTIUS Certified', 'High Throughput'],
      options: { colors: colorList.length ? colorList : ['Default'] },
      isPreorder: !!prodIsPreorder
    };
    if (editingProductId) {
      await updateDoc(doc(db, 'artifacts', appId, 'products', editingProductId), payload);
      showNotification('Product updated globally.');
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'products'), payload);
      showNotification('Product added to live store.');
    }
    setEditingProductId(null);
    setProdName('');
    setProdPrice('');
    setProdImage('');
    setProdImages('');
    setProdVideo('');
    setProdDesc('');
    setProdColorOption('Dark Anodized, Titanium Silver');
    setProdIsPreorder(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!db || !isAdmin) return;
    if (window.confirm('Are you sure you want to delete this product globally?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'products', id));
      showNotification('Product removed from catalog.');
    }
  };

  const handleAddDiscount = async (e) => {
    e.preventDefault();
    if (!db || !isAdmin) return;
    const codeClean = discCode.trim().toUpperCase();
    const payload = {
      code: codeClean,
      active: true,
      ...(discType === 'percent' ? { percent: parseFloat(discVal) } : { fixed: parseFloat(discVal) })
    };
    await setDoc(doc(db, 'artifacts', appId, 'discounts', codeClean), payload);
    setDiscCode('');
    setDiscVal('');
    showNotification('Discount promo code created globally.');
  };

  const handleUpdateOrderStatus = async (targetOrder, newStatus) => {
    if (!isFullAdmin) return;
    const targetDocId = targetOrder.docId || targetOrder.id;
    const orderCode = targetOrder.id;
    const customerEmail = targetOrder.customerEmail;
    const customerName = targetOrder.customerName;
    const orderItems = targetOrder.items;
    const shippingAddr = targetOrder.shippingAddress;

    setOrders((prev) => prev.map((o) => (o.id === orderCode || o.docId === targetDocId ? { ...o, status: newStatus } : o)));

    if (db && targetDocId) {
      try {
        const orderRef = doc(db, 'artifacts', appId, 'orders', targetDocId);
        await setDoc(orderRef, { status: newStatus }, { merge: true });
      } catch (err) {
        console.warn('Firestore update note:', err);
      }
    }

    const formattedItems = Array.isArray(orderItems)
      ? orderItems
          .map(
            (item) =>
              `- ${item.name} (Qty: ${item.qty || 1}) [Color: ${item.selectedColor || 'Standard'}] - £${((item.price || 0) * (item.qty || 1)).toFixed(2)}`
          )
          .join('\n')
      : 'Order item details logged in portal.';

    const statusMsg = `NOTICE OF FULFILLMENT UPDATE:\nYour ZORTIUS Order #${orderCode} status has been updated to: ${newStatus.toUpperCase()}.\n\nSHIPPING ADDRESS:\n${shippingAddr || 'On file'}\n\nORDER CONTENTS:\n${formattedItems}\n\nTrack your order history and live updates anytime in your ZORTIUS profile dashboard.`;
    await sendActualEmail(EMAILJS_ORDER_TEMPLATE_ID, customerEmail, customerName || 'Valued Customer', orderCode, newStatus, statusMsg);
    showNotification(`Order #${orderCode} status updated to '${newStatus}' & email dispatched.`);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      (product.specs && product.specs.some((s) => s.toLowerCase().includes(searchLower)));
    return matchesCategory && matchesSearch;
  });

  const cartItemCount = cart.reduce((acc, item) => acc + (item.qty || 1), 0);

  // -------------------- RENDER --------------------
    const authReady = !!(user && !otpGateActive);
  const sessionUser = authReady ? user : null;

return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-white selection:text-zinc-950">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-bounce ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-zinc-900/90 border-cyan-500/50 text-cyan-200'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle className="w-5 h-5 text-zinc-100" />}
          <span className="text-sm font-medium">{renderSafe(notification.message)}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home', '/')}>
              <img src="/logo.jpg" alt="Zortius" className="h-10 sm:h-12 w-auto object-contain shrink-0" onError={(e) => { e.currentTarget.style.display='none'; }} />
              <div>
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                  ZORTIUS
                </span>
                <span className="block text-[10px] tracking-widest text-cyan-500 font-semibold uppercase">Innovation without a limit</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-7">
              {[
                { tab: 'home', path: '/', label: 'Home' },
                { tab: 'shop', path: '/shop', label: 'Shop' },
                { tab: 'blog', path: '/blog', label: 'Media' },
                { tab: 'forum', path: '/forum', label: 'Forum' },
                { tab: 'applications', path: '/careers', label: 'Careers' },
                { tab: 'compare', path: '/compare', label: 'Compare' },
                { tab: 'about', path: '/about', label: 'About' },
                { tab: 'faq', path: '/faq', label: 'FAQ' },
                { tab: 'contact', path: '/contact', label: 'Contact' },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    if (item.tab === 'contact') { setContactModalOpen(true); return; }
                    navigateTo(item.tab, item.path);
                  }}
                  className={`relative text-[13px] font-medium tracking-wide transition-colors hover:text-white pb-1 ${
                    activeTab === item.tab ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {item.label}
                  {activeTab === item.tab && (
                    <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin', '/admin')}
                  className={`relative text-[13px] font-semibold tracking-wide transition-colors hover:text-zinc-200 pb-1 ${
                    activeTab === 'admin' ? 'text-zinc-100' : 'text-cyan-600'
                  }`}
                >
                  Admin
                  {activeTab === 'admin' && <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-cyan-400" />}
                </button>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAiDrawerOpen(true)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-800 border border-zinc-600 rounded-xl text-zinc-100 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Bot className="w-4 h-4" /> <span className="hidden sm:inline">Support</span>
              </button>

              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900 hover:bg-slate-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-100">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-zinc-200 line-clamp-1">{renderSafe(userName, 'Sign In')}</span>
                  <span className={`block text-[10px] font-medium ${sessionUser ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {sessionUser ? '● Signed In' : '○ Click to Login'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigateTo('cart', '/cart')}
                className="relative p-2.5 bg-zinc-900 hover:bg-slate-800 border border-zinc-800 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">Basket</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-zinc-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      
        {/* MOBILE NAV */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950/98 backdrop-blur-xl">
            <nav className="px-4 py-3 flex flex-col gap-0.5">
              {[
                { tab: 'home', path: '/', label: 'Home' },
                { tab: 'shop', path: '/shop', label: 'Shop' },
                { tab: 'blog', path: '/blog', label: 'Media' },
                { tab: 'forum', path: '/forum', label: 'Forum' },
                { tab: 'applications', path: '/careers', label: 'Careers' },
                { tab: 'compare', path: '/compare', label: 'Compare' },
                { tab: 'orders', path: '/account/orders', label: `Orders (${orders.length})` },
                { tab: 'about', path: '/about', label: 'About' },
                { tab: 'faq', path: '/faq', label: 'FAQ' },
              ].map((item) => (
                <button key={item.tab} type="button" onClick={() => navigateTo(item.tab, item.path)} className={`text-left px-4 py-3.5 rounded-xl text-sm font-medium ${activeTab === item.tab ? 'bg-white/5 text-white' : 'text-zinc-300'}`}>{item.label}</button>
              ))}
              <button type="button" onClick={() => { setContactModalOpen(true); setMobileMenuOpen(false); }} className="text-left px-4 py-3.5 rounded-xl text-sm font-medium text-zinc-300">Contact Support</button>
              {isAdmin && <button type="button" onClick={() => navigateTo('admin', '/admin')} className={`text-left px-4 py-3.5 rounded-xl text-sm font-bold ${activeTab === 'admin' ? 'text-zinc-100' : 'text-cyan-500'}`}>Admin</button>}
              <button type="button" onClick={() => { setProfileModalOpen(true); setMobileMenuOpen(false); }} className="text-left px-4 py-3.5 rounded-xl text-sm font-medium text-zinc-300">{sessionUser ? 'Account' : 'Sign In'}</button>
            </nav>
          </div>
        )}

      </header>
      {/* Live system status */}
      <div className="border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className={`h-1.5 w-1.5 rounded-full ${storeSettings.takingOrders ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="font-semibold text-zinc-300">{storeSettings.statusLabel}</span>
            <span className="text-zinc-600">·</span>
            <span className="truncate max-w-[min(100%,28rem)]">{storeSettings.announcement}</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500">
            <button type="button" onClick={() => setCmdOpen(true)} className="hover:text-zinc-200 transition">
              <span className="hidden sm:inline">⌘K menu</span>
              <span className="sm:hidden">Menu</span>
            </button>
            <button type="button" onClick={() => setAiDrawerOpen(true)} className="hover:text-zinc-200 transition">
              Support
            </button>
          </div>
        </div>
      </div>

      {/* CONTACT MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            <button onClick={() => setContactModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-zinc-100 mb-1">
                <Headphones className="w-5 h-5" />
                <h3 className="text-lg font-extrabold text-white">Contact ZORTIUS Support</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Support Desk: <strong>{SUPPORT_EMAIL}</strong>
              </p>
            </div>
            <form onSubmit={handleSendContactInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Inquiry</label>
                <textarea
                  rows="4"
                  required
                  value={contactInquiry}
                  onChange={(e) => setContactInquiry(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSendingContact}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSendingContact ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSendingContact ? 'Sending Inquiry...' : 'Send Inquiry to Support'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI DRAWER */}
      {aiDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-md h-full max-h-[100dvh] p-4 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-zinc-100">
                <Bot className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Zortius Support</h3>
                  <p className="text-[10px] text-zinc-500">Free assistant · escalates to admin</p>
                </div>
              </div>
              <button type="button" onClick={() => setAiDrawerOpen(false)} className="text-zinc-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0">
              {chatMessages.map((m, i) => (
                <div key={i} className={`text-xs leading-relaxed max-w-[90%] rounded-2xl px-3 py-2 ${m.role === 'user' ? 'ml-auto bg-white text-zinc-950' : 'bg-zinc-950 border border-zinc-800 text-zinc-200'}`}>
                  {m.text}
                  {m.escalate && (
                    <div className="mt-3 space-y-2 border-t border-zinc-800 pt-2">
                      <input type="text" placeholder="Your name" value={escalateName} onChange={(e) => setEscalateName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white" />
                      <input type="email" placeholder="Your email" value={escalateEmail || user?.email || ''} onChange={(e) => setEscalateEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white" />
                      <button type="button" onClick={handleEscalateTicket} className="w-full py-2 rounded-lg bg-white text-zinc-950 font-bold text-xs">Send to admin</button>
                    </div>
                  )}
                </div>
              ))}
              {chatSending && <p className="text-[10px] text-zinc-500">Thinking…</p>}
            </div>
            <form onSubmit={handleChatSend} className="shrink-0 border-t border-zinc-800 pt-3 space-y-2">
              <div className="flex gap-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about pre-orders, products, careers…" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500" />
                <button type="submit" disabled={chatSending} className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs disabled:opacity-50">Send</button>
              </div>
              <p className="text-[10px] text-zinc-500">Say “human” to open a ticket · EmailJS notifies admin</p>
            </form>
          </div>
        </div>
      )}

      
      
      {/* Mobile quick actions */}
      <div className="mobile-quick-actions md:hidden fixed bottom-4 left-4 right-4 z-40 flex gap-2 justify-center pointer-events-none">
        <button type="button" onClick={() => setCmdOpen(true)} className="pointer-events-auto flex-1 max-w-[140px] py-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 text-xs font-bold text-white shadow-xl backdrop-blur">
          Menu
        </button>
        <button type="button" onClick={() => setAiDrawerOpen(true)} className="pointer-events-auto flex-1 max-w-[140px] py-3 rounded-2xl bg-white text-zinc-950 text-xs font-bold shadow-xl shadow-cyan-500/20">
          Support
        </button>
        <button type="button" onClick={() => setProfileModalOpen(true)} className="pointer-events-auto flex-1 max-w-[140px] py-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 text-xs font-bold text-white shadow-xl backdrop-blur">
          Account
        </button>
      </div>

      {/* Command palette ⌘K */}
      {cmdOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4" onClick={() => setCmdOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              placeholder="Jump to… shop, careers, support, admin"
              className="w-full bg-transparent px-4 py-3.5 text-sm text-white outline-none border-b border-zinc-800"
            />
            <div className="max-h-72 overflow-y-auto py-2">
              {[
                { label: 'Shop', tab: 'shop', path: '/shop' },
                { label: 'Compare systems', tab: 'compare', path: '/compare' },
                { label: 'Careers', tab: 'applications', path: '/careers' },
                { label: 'Media', tab: 'blog', path: '/blog' },
                { label: 'Forum', tab: 'forum', path: '/forum' },
                { label: 'Support chatbot', action: () => setAiDrawerOpen(true) },
                { label: 'Saved items', tab: 'wishlist', path: '/wishlist' },
                { label: 'Shipping & returns', tab: 'shipping', path: '/shipping' },
                { label: 'Volume / education enquiry', tab: 'contact', path: '/contact' },
                { label: 'Join newsletter', action: () => { navigateTo('home', '/'); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); } },
                { label: 'Account', action: () => setProfileModalOpen(true) },
                ...(isAdmin ? [{ label: 'Admin panel', tab: 'admin', path: '/admin' }] : []),
              ]
                .filter((i) => !cmdQuery || i.label.toLowerCase().includes(cmdQuery.toLowerCase()))
                .map((i) => (
                  <button
                    key={i.label}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-zinc-200"
                    onClick={() => {
                      if (i.action) i.action();
                      else navigateTo(i.tab, i.path);
                      setCmdOpen(false);
                      setCmdQuery('');
                    }}
                  >
                    {i.label}
                  </button>
                ))}
            </div>
            <p className="px-4 py-2 text-[10px] text-zinc-600 border-t border-zinc-800">Press Esc to close</p>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ADMIN */}
        {isAdmin && activeTab === 'admin' && (
          <div className="space-y-10">
            <div className="bg-zinc-800 border border-zinc-600 rounded-3xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-zinc-100" />
                <div>
                  <h2 className="text-base font-bold text-zinc-200">ADMIN CONTROL CENTER</h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    {isFullAdmin ? `Full Admin · ${ADMIN_EMAIL}` : `Limited Admin · ${LIMITED_ADMIN_EMAIL} (no order management)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Applications Studio */}
            <section className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 sm:p-8 space-y-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-zinc-100" /> Applications Studio
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">Create role sections, build forms, review scores and make the final decision.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Forms', value: jobApplications.length },
                    { label: 'Pending', value: applicationSubmissions.filter((x) => !['Accepted', 'Denied'].includes(x.status)).length },
                    { label: 'Reviewed', value: applicationSubmissions.filter((x) => ['Accepted', 'Denied'].includes(x.status)).length }
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3">
                      <div className="text-xl font-black text-zinc-200">{stat.value}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-100" /> 1. Manage sections
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">Examples: Leadership, Marketing, Product Development, General Staff.</p>
                  </div>
                  <form onSubmit={handleCreateSection} className="flex gap-2">
                    <input
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      required
                      placeholder="New section name"
                      className="min-w-0 flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <button className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-sm">Add</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {applicationSections.map((section) => (
                      <span key={section.id} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 pl-3 pr-1.5 py-1.5 text-xs text-zinc-200">
                        {section.name}
                        <button type="button" title="Delete section" onClick={() => handleDeleteSection(section.id, section.name)} className="p-1 rounded-full text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {!applicationSections.length && <p className="text-xs text-zinc-500">No sections yet — create your first one above.</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-100" /> 2. Build an application
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">Add questions, assign marks and publish the form.</p>
                  </div>
                  <form onSubmit={handleSaveApplication} className="space-y-3">
                    <input
                      value={appTitle}
                      onChange={(e) => setAppTitle(e.target.value)}
                      required
                      placeholder="Application title (e.g. Head of Marketing)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <select
                      value={appSection}
                      onChange={(e) => setAppSection(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    >
                      <option value="">Choose a section…</option>
                      {applicationSections.map((section) => (
                        <option key={section.id} value={section.name}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={appDescription}
                      onChange={(e) => setAppDescription(e.target.value)}
                      rows="2"
                      placeholder="Role description and what you are looking for…"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <div className="rounded-xl border border-zinc-800 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-300">Questions ({appQuestions.length})</span>
                        <span className="text-xs text-zinc-200">Total marks: {appQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)}</span>
                      </div>
                      {appQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-2 bg-zinc-900 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                              {i + 1}. {q.question}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1">
                              {q.type} · {q.marks} marks · {q.required ? 'Required' : 'Optional'}
                            </p>
                          </div>
                          <button type="button" onClick={() => setAppQuestions((prev) => prev.filter((item) => item.id !== q.id))} className="text-zinc-500 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <textarea
                        value={questionDraft}
                        onChange={(e) => setQuestionDraft(e.target.value)}
                        rows="2"
                        placeholder="Write a question…"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white">
                          <option value="short">Short answer</option>
                          <option value="long">Long answer</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                        </select>
                        <input type="number" min="0" max="100" value={questionMarks} onChange={(e) => setQuestionMarks(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white" />
                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                          <input type="checkbox" checked={questionRequired} onChange={(e) => setQuestionRequired(e.target.checked)} /> Required
                        </label>
                        <button type="button" onClick={addApplicationQuestion} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-2 text-xs font-bold text-white">
                          Add question
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={aiGeneratingQuestions}
                      onClick={generateApplicationQuestions}
                      className="w-full rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 font-bold text-sm py-3 flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      {aiGeneratingQuestions ? 'Generating…' : 'AI question assistant'}
                    </button>
                    <button type="submit" className="w-full rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm py-3">
                      {editingApplicationId ? 'Save changes' : 'Publish application'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white">Published applications</h4>
                {jobApplications.length === 0 ? (
                  <p className="text-sm text-zinc-500">No applications published yet.</p>
                ) : (
                  jobApplications.map((application) => (
                    <div key={application.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                      <div>
                        <p className="font-bold text-white">{application.title}</p>
                        <p className="text-xs text-zinc-500">
                          {application.section} · {(application.questions || []).length} questions · {(application.questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} marks
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingApplicationId(application.id);
                            setAppTitle(application.title || '');
                            setAppSection(application.section || '');
                            setAppDescription(application.description || '');
                            setAppQuestions(application.questions || []);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:border-cyan-400"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(application.id, application.title)}
                          className="rounded-lg border border-rose-500/40 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            navigateTo('applications', `/careers/${application.slug || application.id}`);
                          }}
                          className="rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="font-bold text-white">Applicant review queue</h4>
                  <div className="flex gap-2">
                    <select value={applicationFilter} onChange={(e) => setApplicationFilter(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white">
                      <option>Pending</option>
                      <option>Accepted</option>
                      <option>Denied</option>
                      <option>All</option>
                    </select>
                    <input
                      value={applicationSearch}
                      onChange={(e) => setApplicationSearch(e.target.value)}
                      placeholder="Search applicants…"
                      className="w-44 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                {applicationSubmissions
                  .filter(
                    (item) =>
                      (applicationFilter === 'All' ||
                        (applicationFilter === 'Pending' ? !['Accepted', 'Denied'].includes(item.status) : item.status === applicationFilter)) &&
                      `${item.applicantName} ${item.applicantEmail} ${item.applicationTitle}`.toLowerCase().includes(applicationSearch.toLowerCase())
                  )
                  .map((submission) => (
                    <div key={submission.id} className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">
                            {submission.applicantName} <span className="text-xs font-normal text-zinc-500">· {submission.applicantEmail}</span>
                          </p>
                          <p className="text-sm text-zinc-200 mt-1">
                            {submission.applicationTitle} · {submission.section}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">Submitted {new Date(submission.submittedAt).toLocaleString('en-GB')}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="rounded-full bg-zinc-900 border border-zinc-700 px-3 py-1 text-xs">{submission.status || 'Pending'}</span>
                          <span className="text-sm font-bold text-white">
                            {submission.preliminaryMark?.score ?? '—'} / {submission.preliminaryMark?.maxScore ?? '—'}{' '}
                            <span className="text-xs font-normal text-zinc-500">preliminary</span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(submission.questions || []).map((q, i) => (
                          <div key={q.id} className="rounded-xl bg-zinc-900 p-3">
                            <p className="text-xs font-bold text-zinc-300">
                              {i + 1}. {q.question} <span className="text-zinc-200">({q.marks} marks)</span>
                            </p>
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap mt-2">{submission.answers?.[q.id] || 'No answer'}</p>
                            <p className="text-[11px] text-amber-300 mt-2">
                              {submission.preliminaryMark?.breakdown?.find((b) => b.questionId === q.id)?.score ?? 0}/{q.marks} preliminary marks — staff review required
                            </p>
                          </div>
                        ))}
                      </div>
                      {!['Accepted', 'Denied'].includes(submission.status) && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleApplicationDecision(submission, 'Accepted')}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 text-sm font-black flex items-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" /> Accept & email
                          </button>
                          <button
                            onClick={() => handleApplicationDecision(submission, 'Denied')}
                            className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 px-4 py-2.5 text-sm font-bold flex items-center gap-2"
                          >
                            <ThumbsDown className="w-4 h-4" /> Deny & email
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                <p className="text-[11px] text-zinc-500">
                  Scoring note: configure VITE_AI_MARKING_ENDPOINT on a secure server for genuine AI-assisted marking. Without it, scores are only basic answer-completeness estimates. All scores require human review.
                </p>
              </div>
            </section>

            {/* Product CRUD */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Global Store Products
              </h3>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Product Name" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                <input type="number" step="0.01" placeholder="Price (£)" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono" />
                <input type="text" placeholder="Category" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                <input type="url" placeholder="Image URL" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none md:col-span-2" />
                <textarea placeholder="Extra image URLs (one per line) — Amazon-style gallery" value={prodImages} onChange={(e) => setProdImages(e.target.value)} rows="3" className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 sm:col-span-2 font-mono text-xs" />
                <input type="url" placeholder="Product video URL (YouTube / MP4)" value={prodVideo} onChange={(e) => setProdVideo(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 sm:col-span-2" />
                <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={prodIsPreorder} onChange={(e) => setProdIsPreorder(e.target.checked)} className="rounded border-slate-600" />
                  <span><strong className="text-white">Pre-order mode</strong> — customers register interest instead of checkout</span>
                </label>
                <input type="text" placeholder="Colors (comma-separated)" value={prodColorOption} onChange={(e) => setProdColorOption(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                <textarea placeholder="Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows="2" className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none md:col-span-3" />
                <button type="submit" className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 rounded-xl text-xs md:col-span-3 cursor-pointer">
                  {editingProductId ? 'Update Product' : 'Add Product to Live Store'}
                </button>
              </form>
              <div className="divide-y divide-slate-800 pt-4">
                {products.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-zinc-100 font-mono ml-3">£{p.price}</span>
                      {p.options?.colors && <span className="text-zinc-500 ml-2">[{p.options.colors.join(', ')}]</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProdName(p.name);
                          setProdPrice(p.price);
                          setProdCategory(p.category);
                          setProdImage(p.image || '');
                          setProdImages((p.images || (p.image ? [p.image] : [])).join('\n'));
                          setProdVideo(p.videoUrl || '');
                          setProdDesc(p.description || '');
                          setProdColorOption((p.options?.colors || ['Default']).join(', '));
                          setProdIsPreorder(p.isPreorder !== false);
                        }}
                        className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-zinc-400 hover:text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Discount Engine */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" /> Global Promo & Discount Codes
              </h3>
              <form onSubmit={handleAddDiscount} className="flex gap-3">
                <input type="text" placeholder="CODE (e.g. ZORT20)" required value={discCode} onChange={(e) => setDiscCode(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs uppercase text-white flex-1 outline-none" />
                <input type="number" placeholder="Value" required value={discVal} onChange={(e) => setDiscVal(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white w-28 outline-none" />
                <select value={discType} onChange={(e) => setDiscType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="percent">% Off</option>
                  <option value="fixed">£ Off</option>
                </select>
                <button type="submit" className="bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer">
                  Create
                </button>
              </form>
              <div className="flex flex-wrap gap-2 pt-2">
                {discounts.map((d) => (
                  <div key={d.id} className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2">
                    <span className="font-bold text-zinc-100">{d.code}</span>
                    <span className="text-zinc-400">({d.percent ? `${d.percent}% OFF` : `£${d.fixed} OFF`})</span>
                  </div>
                ))}
              </div>
            </section>

            
            {isFullAdmin && (
              <section className="bg-gradient-to-br from-cyan-500/10 to-slate-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4">
                <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">Launch control</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-2"><p className="text-lg font-bold text-white">{preorders.length}</p><p className="text-[10px] text-zinc-500">Pre-orders</p></div>
                  <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-2"><p className="text-lg font-bold text-white">{supportTickets.filter((t) => t.status !== 'Resolved').length}</p><p className="text-[10px] text-zinc-500">Open tickets</p></div>
                  <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-2"><p className="text-lg font-bold text-white">{orders.length}</p><p className="text-[10px] text-zinc-500">Orders</p></div>
                  <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-2"><p className="text-lg font-bold text-white">{(applicationSubmissions || []).length}</p><p className="text-[10px] text-zinc-500">Applications</p></div>
                </div>
                <p className="text-xs text-zinc-400">Toggle checkout mode and the banner every visitor sees site-wide.</p>
                <button
                  type="button"
                  onClick={() => saveStoreSettings({
                    takingOrders: !storeSettings.takingOrders,
                    statusLabel: !storeSettings.takingOrders ? 'Orders open' : 'Pre-order mode'
                  })}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${storeSettings.takingOrders ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-200'}`}
                >
                  {storeSettings.takingOrders ? 'Orders OPEN — click to switch to pre-order' : 'Pre-order only — click to open orders'}
                </button>
                <textarea
                  rows={2}
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  placeholder="Announcement under the header…"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button type="button" onClick={() => saveStoreSettings({ announcement: announcementDraft || storeSettings.announcement })} className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold">
                  Save announcement
                </button>
              </section>
            )}

            {isFullAdmin && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">Newsletter subscribers</h3>
                  <button type="button" onClick={exportNewsletterCsv} className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold">Export CSV ({newsletters.length})</button>
                </div>
                <p className="text-xs text-zinc-400">People who joined the launch / updates list.</p>
                {newsletters.length === 0 ? (
                  <p className="text-xs text-zinc-500">No subscribers yet.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                    {newsletters.slice(0, 50).map((n) => (
                      <div key={n.id} className="flex justify-between gap-2 text-zinc-300 border-b border-zinc-800/50 py-1">
                        <span className="break-all">{n.email}</span>
                        <span className="text-zinc-600 whitespace-nowrap">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB') : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {isFullAdmin && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">Pre-order interest list</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      const emails = preorders.map((p) => p.email).filter(Boolean).join(', ');
                      navigator.clipboard?.writeText(emails);
                      showNotification('Emails copied');
                    }} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-zinc-700 text-zinc-200 text-xs font-bold">
                      Copy emails
                    </button>
                    <button type="button" onClick={emailAllPreorders} className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold">Email all</button>
                    <button type="button" onClick={exportPreordersCsv} className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs font-bold">
                      Export CSV ({preorders.length})
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-400">People who registered interest. Contact them when you open orders.</p>
                {preorders.length === 0 ? (
                  <p className="text-xs text-zinc-500">No pre-order signups yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950 text-zinc-400">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Email</th>
                          <th className="px-3 py-2 font-semibold">Product</th>
                          <th className="px-3 py-2 font-semibold">Colour</th>
                          <th className="px-3 py-2 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {preorders.map((row) => (
                          <tr key={row.id} className="text-zinc-200">
                            <td className="px-3 py-2.5 break-all">{row.email}</td>
                            <td className="px-3 py-2.5">{row.productName || 'General'}</td>
                            <td className="px-3 py-2.5 text-zinc-200">{row.color || '—'}</td>
                            <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">{row.createdAt ? new Date(row.createdAt).toLocaleString('en-GB') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* SUPPORT TICKETS */}
            <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Headphones className="w-4 h-4 text-zinc-100" /> Support tickets ({supportTickets.length})</h3>
              <p className="text-xs text-zinc-400">From the free chatbot when users ask for a human.</p>
              {supportTickets.length === 0 ? (
                <p className="text-xs text-zinc-500">No tickets yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-white">{t.name} · {t.email}</span>
                        <span className={`px-2 py-0.5 rounded-full border ${t.status === 'Open' ? 'border-amber-500/40 text-amber-300' : 'border-emerald-500/40 text-emerald-300'}`}>{t.status || 'Open'}</span>
                      </div>
                      <p className="text-zinc-300">{t.message}</p>
                      <p className="text-zinc-500">{t.createdAt ? new Date(t.createdAt).toLocaleString('en-GB') : ''} · {t.page || ''}</p>
                      <textarea
                        rows={2}
                        value={ticketReply[t.id] || ''}
                        onChange={(e) => setTicketReply((m) => ({ ...m, [t.id]: e.target.value }))}
                        placeholder="Type a reply to email the customer…"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => sendTicketReply(t)} className="px-2 py-1 rounded-lg bg-white text-zinc-950 font-bold">Email reply</button>
                        <button type="button" onClick={() => handleTicketStatus(t.id, 'Open')} className="px-2 py-1 rounded-lg bg-slate-800 text-zinc-200">Open</button>
                        <button type="button" onClick={() => handleTicketStatus(t.id, 'Resolved')} className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300">Resolved</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* MEDIA / BLOG ADMIN */}
            {isFullAdmin && (
              <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-100" /> Publish media / blog</h3>
                <form onSubmit={handleSaveBlog} className="space-y-3">
                  <input required value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="Headline" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white" />
                  <textarea required rows={5} value={blogBody} onChange={(e) => setBlogBody(e.target.value)} placeholder="Article body…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white" />
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={blogAllowComments} onChange={(e) => setBlogAllowComments(e.target.checked)} /> Allow comments</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={blogAllowLikes} onChange={(e) => setBlogAllowLikes(e.target.checked)} /> Allow likes</label>
                  </div>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-sm">Publish</button>
                </form>
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  {blogPosts.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-zinc-200 truncate">{p.title}</span>
                      <button type="button" onClick={() => handleDeleteBlog(p.id)} className="text-rose-400 hover:text-rose-300">Delete</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ORDERS — FULL ADMIN ONLY */}
            {isFullAdmin && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <PackageCheck className="w-4 h-4" /> Comprehensive Customer Orders Management
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono text-xs">
                    Total Orders Logged: <strong>{orders.length}</strong>
                  </span>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono">No customer orders recorded yet.</p>
                ) : (
                  <div className="space-y-6">
                    {orders.map((o) => (
                      <div key={o.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-5 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-zinc-800 pb-4">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold block mb-1">Order Ref & Client</span>
                            <span className="font-mono font-black text-white text-sm block">{o.id}</span>
                            <span className="text-zinc-300 block font-medium mt-0.5">{o.customerName || 'Customer'}</span>
                            <span className="text-zinc-500 block font-mono text-[11px]">{o.customerEmail}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold block mb-1">Shipping & Metadata</span>
                            <div className="space-y-1 text-zinc-300 font-mono">
                              <span className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-zinc-100 shrink-0 mt-0.5" />
                                <span>
                                  {o.shipping ? (
                                    <>
                                      {o.shipping.fullName}
                                      <br />
                                      {o.shipping.line1}
                                      {o.shipping.line2 && (
                                        <>
                                          <br />
                                          {o.shipping.line2}
                                        </>
                                      )}
                                      <br />
                                      {o.shipping.city} {o.shipping.postcode}
                                      <br />
                                      {o.shipping.country}
                                      {o.shipping.phone && (
                                        <>
                                          <br />
                                          Tel: {o.shipping.phone}
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    o.shippingAddress || 'Address on file'
                                  )}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-zinc-100 shrink-0" /> Placed: {o.date || 'Today'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-zinc-100 shrink-0" /> Gateway: {o.paymentMethod || 'Stripe'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col justify-between items-start md:items-end">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold block mb-1">Order Status Control</span>
                            <select
                              value={o.status || 'Processing'}
                              onChange={(e) => handleUpdateOrderStatus(o, e.target.value)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
                                o.status === 'Delivered'
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                                  : o.status === 'Shipped'
                                    ? 'bg-cyan-950/80 border-cyan-500 text-zinc-200'
                                    : o.status === 'Canceled'
                                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                                      : 'bg-amber-950/80 border-amber-500 text-amber-300'
                              }`}
                            >
                              <option value="Processing">🟡 Processing</option>
                              <option value="Shipped">🔵 Shipped</option>
                              <option value="Delivered">🟢 Delivered</option>
                              <option value="Canceled">🔴 Canceled</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-zinc-100 uppercase font-bold flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" /> Order Manifest ({Array.isArray(o.items) ? o.items.length : 0} items)
                          </span>
                          <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 divide-y divide-slate-800/80 overflow-hidden">
                            {Array.isArray(o.items) &&
                              o.items.map((item, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0" />}
                                    <div>
                                      <span className="font-bold text-zinc-100 block">{item.name}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                                        <span>Category: {item.category || 'Hardware'}</span>
                                        <span>•</span>
                                        <span className="text-zinc-200 font-semibold">Finish: {item.selectedColor || 'Standard'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-xs text-zinc-300 font-bold block">
                                      £{(item.price || 0).toFixed(2)} × {item.qty || 1}
                                    </span>
                                    <span className="text-[10px] text-zinc-100 font-semibold">Subtotal: £{((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80 font-mono text-xs">
                          <div className="text-zinc-400 space-x-3">
                            <span>
                              Subtotal: <strong>£{(o.subtotal || o.total || 0).toFixed(2)}</strong>
                            </span>
                            {o.discountAmount > 0 && (
                              <span className="text-emerald-400">
                                Discount: <strong>-£{o.discountAmount.toFixed(2)}</strong>
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-200">
                            Paid Total: <strong className="text-zinc-100 text-sm font-black">£{Number(o.total || 0).toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* APPLICATIONS PUBLIC */}
        {activeTab === 'applications' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-zinc-700 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/50 p-8 sm:p-12">
              <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full border border-cyan-400/10" />
              <div className="relative max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200">
                  <Users className="w-4 h-4" /> JOIN THE TEAM
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-white">
                  Build what's next at <span className="text-zinc-100">Zortius.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300">
                  Explore open roles, tell us what you bring to the team, and track the application process. Every application is reviewed by a member of our team.
                </p>
              </div>
            </section>

            {selectedApplication ? (
              <section className="max-w-3xl mx-auto rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-9 space-y-6">
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                    navigateTo('applications', '/careers');
                  }}
                  className="text-sm text-zinc-200 hover:text-cyan-200"
                >
                  ← All applications
                </button>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">{selectedApplication.section}</span>
                  <h2 className="mt-2 text-3xl font-black text-white">{selectedApplication.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {selectedApplication.description || 'Complete the questions below to apply for this opportunity at Zortius.'}
                  </p>
                </div>
                <div className="flex gap-3 rounded-xl border border-zinc-700 bg-cyan-500/5 p-4 text-xs text-zinc-300">
                  <Shield className="w-5 h-5 shrink-0 text-zinc-200" />
                  <p>Your answers are shared with the Zortius team for application review. You will receive an email confirmation after submitting.</p>
                </div>
                <form onSubmit={handleSubmitApplication} className="space-y-5">
                  {(selectedApplication.questions || []).map((q, i) => (
                    <div key={q.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
                      <label className="block text-sm font-bold text-white">
                        {i + 1}. {q.question}
                        {q.required && <span className="text-rose-400"> *</span>}
                        <span className="block mt-1 text-xs font-normal text-zinc-500">
                          {q.marks} marks · {q.type === 'long' ? 'Long answer' : q.type === 'short' ? 'Short answer' : q.type}
                        </span>
                      </label>
                      {q.type === 'long' ? (
                        <textarea
                          rows="5"
                          required={q.required}
                          value={applicationAnswers[q.id] || ''}
                          onChange={(e) => setApplicationAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Write your answer…"
                          className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      ) : (
                        <input
                          type={q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text'}
                          required={q.required}
                          value={applicationAnswers[q.id] || ''}
                          onChange={(e) => setApplicationAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Your answer…"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">Signed in as {user?.email || 'not signed in'}. You must sign in to submit.</p>
                    <button disabled={applicationSubmitting} className="rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 px-6 py-3.5 text-sm font-black text-zinc-950">
                      {applicationSubmitting ? 'Submitting…' : 'Submit application →'}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <div className="space-y-8">
                {applicationSections.map((section) => {
                  const sectionApps = jobApplications.filter((a) => a.section === section.name && a.published !== false);
                  return (
                    <section key={section.id} className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h2 className="text-xl font-black text-white">{section.name}</h2>
                          <p className="text-sm text-zinc-400 mt-1">Opportunities in {section.name.toLowerCase()}.</p>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {sectionApps.length} open {sectionApps.length === 1 ? 'role' : 'roles'}
                        </span>
                      </div>
                      {sectionApps.length ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {sectionApps.map((a) => (
                            <article key={a.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 hover:border-zinc-600 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-3 text-zinc-200">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300">Open</span>
                              </div>
                              <h3 className="mt-4 text-lg font-black text-white">{a.title}</h3>
                              <p className="mt-2 text-sm text-zinc-400 line-clamp-3">{a.description || 'Apply to join the Zortius team and help us build great things.'}</p>
                              <div className="mt-5 flex items-center justify-between gap-3">
                                <span className="text-xs text-zinc-400">
                                  {(a.questions || []).length} questions · ~{Math.max(5, Math.round((a.questions || []).length * 1.5))} mins
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(a);
                                    setApplicationAnswers({});
                                    navigateTo('applications', `/careers/${a.slug || a.id}`);
                                  }}
                                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-zinc-950 group-hover:bg-cyan-400"
                                >
                                  View & apply <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">No open roles in this section yet.</p>
                      )}
                    </section>
                  );
                })}
                {!applicationSections.length && (
                  <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
                    <Layers className="w-10 h-10 mx-auto text-zinc-600" />
                    <h2 className="mt-4 font-bold text-white">Applications are coming soon</h2>
                    <p className="mt-2 text-sm text-zinc-500">There are no published opportunities at the moment. Please check back later.</p>
                  </div>
                )}
                {user && (
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <h3 className="font-bold text-white">Your application history</h3>
                    {applicationSubmissions.filter((x) => x.applicantUid === user.uid).length === 0 ? (
                      <p className="mt-2 text-sm text-zinc-500">You have not submitted an application yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {applicationSubmissions
                          .filter((x) => x.applicantUid === user.uid)
                          .map((x) => (
                            <div key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950 p-3">
                              <div>
                                <p className="text-sm font-bold text-white">{x.applicationTitle}</p>
                                <p className="text-xs text-zinc-500">{new Date(x.submittedAt).toLocaleDateString('en-GB')}</p>
                              </div>
                              <span className="text-xs font-bold text-zinc-200">{x.status || 'Pending'}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATIC PAGES */}
        {['about', 'faq', 'privacy', 'terms', 'account', 'contact'].includes(activeTab) && (
          <div className="max-w-4xl mx-auto py-8 space-y-6">
            <button onClick={() => navigateTo('shop', '/shop')} className="text-sm text-zinc-200 hover:text-cyan-200">
              ← Back to store
            </button>
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 sm:p-12">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-100">ZORTIUS · Innovation without a limit</span>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white">
                {
                  {
                    about: 'About Zortius',
                    faq: 'Frequently asked questions',
                    privacy: 'Privacy policy',
                    terms: 'Terms of service',
                    account: 'Your account',
                    contact: 'Contact Zortius'
                  }[activeTab]
                }
              </h1>
              {activeTab === 'about' && (
                <p className="mt-4 text-zinc-300 leading-relaxed">
                  Zortius is a hardware company. We design workstations, displays, and peripherals for people who care about specs, thermals, and long sessions — not marketing noise. Based around a UK-first launch, we sell pre-order interest today and full checkout when manufacturing is ready.
                </p>
              )}
              {activeTab === 'faq' && (
                <div className="mt-5 space-y-4 text-sm text-zinc-300">
                  <div>
                    <h3 className="font-bold text-white">How do I apply to join the team?</h3>
                    <p className="mt-1">Visit Applications, choose an open role, sign in and complete the form.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Will I receive confirmation?</h3>
                    <p className="mt-1">Yes — you receive an email after submitting, and again when a decision is made.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">How can I contact support?</h3>
                    <p className="mt-1">Use Support in the header, or email {SUPPORT_EMAIL}.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">When can I buy?</h3>
                    <p className="mt-1">Join pre-order interest or the newsletter. Checkout opens when we switch Launch control to orders open.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Shipping?</h3>
                    <p className="mt-1">See Shipping & returns in the footer. UK-first, tracked.</p>
                  </div>
                </div>
              )}
              {activeTab === 'privacy' && (
                <p className="mt-4 text-zinc-300 leading-relaxed">
                  Zortius only collects information needed to operate accounts, process orders and review applications.
                </p>
              )}
              {activeTab === 'terms' && (
                <p className="mt-4 text-zinc-300 leading-relaxed">Draft terms placeholder. Publish final purchase, delivery and returns terms before accepting real orders.</p>
              )}
              {activeTab === 'account' && (
                <div className="mt-5 space-y-3">
                  <p className="text-zinc-300">{sessionUser ? `Signed in as ${user.email}` : 'Sign in to manage your account and applications.'}</p>
                  <button onClick={() => setProfileModalOpen(true)} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-zinc-950">
                    {sessionUser ? 'Account settings' : 'Sign in / create account'}
                  </button>
                </div>
              )}
              {activeTab === 'contact' && (
                <div className="mt-5 space-y-3">
                  <p className="text-zinc-300">For help with orders, accounts or applications, contact our support team.</p>
                  <a className="text-zinc-200 underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                  <div>
                    <button onClick={() => setContactModalOpen(true)} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-zinc-950">
                      Open contact form
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* SHOP CATALOG */}
        
        {/* ========== HOME (Apple-style) ========== */}
        {activeTab === 'home' && (
          <div className="space-y-16 sm:space-y-24 -mt-2">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/[0.07] bg-zinc-950 px-6 py-20 sm:px-14 sm:py-28 text-center shadow-[0_0_80px_-20px_rgba(34,211,238,0.25)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(34,211,238,0.18),_transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(15,23,42,0.9),_transparent_50%)]" />
              <div className="relative max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-wide text-zinc-200">Pre-order interest open · zortius.com</span>
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white leading-[1.05]">
                  Hardware with<br className="hidden sm:block" /> nothing to hide.
                </h1>
                <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  Workstations, displays, and peripherals built for creators and engineers — quiet power, clean design, honest specs.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button type="button" onClick={() => navigateTo('shop', '/shop')} className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition">
                    Browse collection
                  </button>
                  <button type="button" onClick={() => navigateTo('compare', '/compare')} className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition">
                    Compare systems
                  </button>
                </div>
                <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
                  {[
                    ['UK-first', 'Support & shipping'],
                    ['Pre-order', 'Launch waitlist'],
                    ['Verified', 'Buyer reviews'],
                  ].map(([t, s]) => (
                    <div key={t} className="rounded-2xl border border-white/5 bg-white/[0.03] px-2 py-3">
                      <p className="text-sm font-bold text-white">{t}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Feature strip */}
            <section className="grid sm:grid-cols-3 gap-px bg-zinc-800/50 rounded-2xl overflow-hidden border border-zinc-800">
              {[
                { t: 'Quiet power', d: 'Systems tuned for long renders and compiles — not RGB theater.' },
                { t: 'Clear specs', d: 'What you read is what ships. No inflated marketing rows.' },
                { t: 'Real support', d: 'Chat, tickets, and humans — not a dead FAQ wall.' },
              ].map((f) => (
                <div key={f.t} className="bg-zinc-950 p-6 sm:p-8">
                  <h3 className="text-sm font-semibold text-white tracking-tight">{f.t}</h3>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{f.d}</p>
                </div>
              ))}
            </section>

            <section className="text-center py-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 mb-3">Designed for</p>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto">Studios · Research labs · Engineering teams · Independent creators</p>
            </section>

            
            <section className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] sm:text-xs text-zinc-500 tracking-wide">
              <span>Secure accounts</span>
              <span className="hidden sm:inline text-slate-700">·</span>
              <span>GBP pricing</span>
              <span className="hidden sm:inline text-slate-700">·</span>
              <span>Pre-order interest open</span>
              <span className="hidden sm:inline text-slate-700">·</span>
              <span>UK support</span>
            </section>

            
                        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Stay in the loop</p>
                  <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-3 leading-tight">Be first when orders open.</h2>
                  <p className="text-sm text-zinc-400 mt-4 leading-relaxed max-w-md">
                    Launch windows, hardware notes, and careers — occasional emails, no noise. If nothing arrives, check junk once and mark us as safe.
                  </p>
                  <ul className="mt-6 space-y-2 text-xs text-zinc-500">
                    <li className="flex gap-2"><span className="text-white">✓</span> Pre-order open alerts</li>
                    <li className="flex gap-2"><span className="text-white">✓</span> New system announcements</li>
                    <li className="flex gap-2"><span className="text-white">✓</span> Unsubscribe any time</li>
                  </ul>
                </div>
                <form onSubmit={handleNewsletterSignup} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                  <label className="block text-xs font-medium text-zinc-400">Email address</label>
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={newsletterBusy}
                    className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition disabled:opacity-50"
                  >
                    {newsletterBusy ? 'Submitting…' : 'Subscribe'}
                  </button>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">By subscribing you agree to receive product updates from Zortius. We never sell your address.</p>
                </form>
              </div>
            </section>

<section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-100/90">Collection</p>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-1">Featured systems</h2>
                </div>
                <button type="button" onClick={() => navigateTo('shop', '/shop')} className="text-xs font-semibold text-zinc-100 hover:text-zinc-200">View all →</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProduct(p)}
                    className="group text-left rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-600 transition"
                  >
                    <div className="aspect-[4/3] bg-zinc-950 overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{p.category}</p>
                      <h3 className="text-sm font-bold text-white mt-1 group-hover:text-zinc-200 transition">{p.name}</h3>
                      <p className="text-zinc-100 font-semibold text-sm mt-2">£{Number(p.price).toLocaleString('en-GB')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Pre-order strip */}
            <section className="rounded-[1.5rem] border border-zinc-700 bg-cyan-500/5 px-6 py-8 sm:px-10 flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Pre-order interest</h2>
                <p className="mt-2 text-sm sm:text-base text-zinc-400 leading-relaxed">We are not processing payments yet. Register your interest and we will notify you when pre-orders open.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handlePreorder(null); }} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:min-w-[360px]">
                <input type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="Email address" className="flex-1 rounded-full bg-zinc-950 border border-zinc-700 px-5 py-3 text-sm text-white outline-none focus:border-cyan-500" />
                <button type="submit" disabled={waitlistSubmitting} className="rounded-full bg-white text-zinc-950 font-semibold text-sm px-6 py-3 hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap">
                  {waitlistSubmitting ? 'Saving…' : 'Notify me'}
                </button>
              </form>
            </section>

            {/* Featured */}
            <section>
              <div className="flex items-end justify-between mb-6 sm:mb-8 px-1">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Featured</h2>
                  <p className="text-sm text-zinc-400 mt-1">A closer look at the lineup.</p>
                </div>
                <button type="button" onClick={() => navigateTo('shop', '/shop')} className="text-sm font-medium text-zinc-100 hover:text-zinc-200">View all →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProduct(p)}
                    className="group text-left rounded-[1.5rem] border border-white/5 bg-zinc-900/80 overflow-hidden hover:border-white/15 transition-all"
                  >
                    <div className="aspect-[16/10] bg-zinc-950 overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{p.category}</p>
                      <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white tracking-tight">{p.name}</h3>
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{p.description}</p>
                      <p className="mt-4 text-base font-medium text-white">From £{Number(p.price).toLocaleString('en-GB', { minimumFractionDigits: 0 })}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Values strip */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { t: 'Precision build', d: 'Materials and thermal design tuned for sustained professional workloads.' },
                { t: 'Clear pricing', d: 'Transparent GBP pricing. Pre-order interest now — checkout when we launch.' },
                { t: 'Human support', d: 'Real engineers on the other side of Support when you need them.' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
                  <h3 className="text-base font-semibold text-white">{x.t}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{x.d}</p>
                </div>
              ))}
            </section>
          </div>
        )}


        {activeTab === 'shop' && !selectedProduct && (
          <div className="space-y-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-8 sm:p-12 border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-4 ${storeSettings.takingOrders ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
                  <Zap className="w-3.5 h-3.5" /> {storeSettings.statusLabel}
                </span>
                <p className="text-xs text-zinc-400 mb-4 max-w-md">{storeSettings.announcement}</p>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">Precision Engineering for High Performance</h1>
                <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                  Discover workstation class compute systems, acoustically engineered chassis, reference displays, and ultra-low noise peripherals.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { const el = document.getElementById('catalog-grid'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm">Browse Catalog</button>
                  <button type="button" onClick={() => setAiDrawerOpen(true)} className="px-5 py-3 rounded-xl border border-zinc-600 bg-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold text-sm flex items-center gap-2"><Bot className="w-4 h-4" /> Configure Custom System</button>
                </div>
              </div>
            </div>

            
            <div className="rounded-2xl border border-zinc-600 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Pre-order interest — get notified at launch</p>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">Payments are not open yet. Join the pre-order list and we will email you when you can complete a purchase.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handlePreorder(null); }} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:min-w-[320px]">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-zinc-950 font-bold text-sm whitespace-nowrap"
                  >
                    {waitlistSubmitting ? 'Saving…' : 'Join pre-order list'}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
              <div className="flex flex-wrap gap-2">
                {['All', 'Workstations', 'Desktops', 'Displays', 'Peripherals', 'Accessories', 'Audio'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat ? 'bg-white text-zinc-950 shadow-md' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog items, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div id="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProduct(product)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openProduct(product); }}
                  className="group bg-zinc-900/70 hover:bg-zinc-900 border border-white/5 hover:border-zinc-600 rounded-[1.25rem] overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div
                      className="relative aspect-video overflow-hidden bg-zinc-950 cursor-pointer"
                      onClick={() => openProduct(product)}
                    >
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-zinc-950/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-zinc-100 border border-zinc-800">
                        {renderSafe(product.category)}
                      </span>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold text-white">{renderSafe(product.rating)}</span>
                        <span className="text-zinc-500">({renderSafe(product.reviewsCount)} reviews)</span>
                      </div>
                      <h3
                        onClick={() => openProduct(product)}
                        className="text-lg font-bold text-white group-hover:text-zinc-100 transition-colors cursor-pointer line-clamp-1"
                      >
                        {renderSafe(product.name)}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{renderSafe(product.description)}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">Unit Price</span>
                        <span className="text-xl font-black text-white">£{Number(product.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <button
                        onClick={(e) => {
                        e.stopPropagation();
                        if (product.options?.colors?.length) setSelectedColor(product.options.colors[0]);
                          addToCart(product);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCT DETAIL */}
        {activeTab === 'shop' && selectedProduct && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <button
              onClick={() => {
                setSelectedProduct(null);
                navigateTo('shop', '/shop');
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              ← Back to Catalog
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 bg-zinc-900/60 rounded-2xl sm:rounded-3xl border border-zinc-800 p-4 sm:p-10 shadow-2xl">
              <div className="space-y-3">
                <div className="aspect-square min-h-[280px] sm:min-h-[420px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 relative">
                  {(selectedProduct.images && selectedProduct.images.length
                    ? selectedProduct.images
                    : [selectedProduct.image]
                  ).map((src, i) => (
                    i === productGalleryIndex ? (
                      <img key={src + i} src={src} alt={`${selectedProduct.name} ${i + 1}`} className="w-full h-full object-cover" />
                    ) : null
                  ))}
                  {selectedProduct.videoUrl && productGalleryIndex === -1 && (
                    selectedProduct.videoUrl.includes('youtube.com') || selectedProduct.videoUrl.includes('youtu.be') ? (
                      <iframe
                        title="Product video"
                        className="absolute inset-0 w-full h-full"
                        src={selectedProduct.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={selectedProduct.videoUrl} controls className="w-full h-full object-cover" />
                    )
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(selectedProduct.images && selectedProduct.images.length
                    ? selectedProduct.images
                    : selectedProduct.image
                      ? [selectedProduct.image]
                      : []
                  ).map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setProductGalleryIndex(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border ${productGalleryIndex === i ? 'border-cyan-400 ring-1 ring-cyan-400' : 'border-zinc-800'}`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {selectedProduct.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setProductGalleryIndex(-1)}
                      className={`shrink-0 w-16 h-16 rounded-lg border flex items-center justify-center text-[10px] font-bold ${productGalleryIndex === -1 ? 'border-cyan-400 text-zinc-200' : 'border-zinc-800 text-zinc-400'}`}
                    >
                      VIDEO
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs font-semibold">{renderSafe(selectedProduct.category)}</span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2">{renderSafe(selectedProduct.name)}</h1>
                  <div className="flex items-center gap-2 text-amber-400 text-sm mb-4">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-white">{renderSafe(selectedProduct.rating)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6">{renderSafe(selectedProduct.description)}</p>

                  {selectedProduct.specs && (
                    <ul className="mb-4 space-y-1">
                      {selectedProduct.specs.map((s, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-zinc-100" /> {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  {selectedProduct.options?.colors && (
                    <div className="mb-4">
                      <span className="text-sm font-bold text-zinc-300 block mb-3">Choose colour / finish</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.options.colors.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(col)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                              selectedColor === col ? 'bg-white text-zinc-950 font-bold' : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-cyan-500/50'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 block">Total Price (GBP)</span>
                    <span className="text-3xl font-black text-white">£{Number(selectedProduct.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {selectedProduct.isPreorder !== false ? (
                      <button type="button" disabled={waitlistSubmitting} onClick={() => { if (user?.email) setWaitlistEmail(user.email); handlePreorder(selectedProduct); }} className="px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                        {waitlistSubmitting ? 'Saving…' : 'Register pre-order interest'}
                      </button>
                    ) : (
                      <button type="button" onClick={() => addToCart(selectedProduct)} className="px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                        <ShoppingCart className="w-5 h-5" /> Add to Basket
                      </button>
                    )}
                  </div>
                  {selectedProduct.isPreorder !== false && (
                    <p className="text-xs text-amber-200/90">This product is in <strong>pre-order</strong> mode — we notify you at launch. Checkout is not open yet.</p>
                  )}
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Warranty details confirmed at purchase. Typical coverage aims for 12 months on systems unless stated otherwise. See Shipping & returns for delivery rules.</p>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(selectedProduct)}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {wishlist.some((x) => x.id === selectedProduct.id) ? '♥ Saved' : '♡ Save for later'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/shop`;
                      navigator.clipboard?.writeText(url + '?product=' + selectedProduct.id);
                      showNotification('Link copied');
                    }}
                    className="text-xs font-semibold text-zinc-500 hover:text-white transition ml-3"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </div>

            {/* Reviews — only after Delivered */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Verified Buyer Reviews</h3>
              {hasUserReceivedProduct(selectedProduct.id) ? (
                <form onSubmit={submitReview} className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-100 uppercase">Write a Verified Review</h4>
                  <select value={newReviewRating} onChange={(e) => setNewReviewRating(Number(e.target.value))} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  <textarea rows="3" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} placeholder="Share your experience..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
                  <button type="submit" className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer">
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-100" />
                  <span>Only verified buyers whose order status is <strong className="text-emerald-400">Delivered</strong> can submit reviews.</span>
                </div>
              )}

              <div className="space-y-4 pt-2">
                {!reviews[selectedProduct.id] || reviews[selectedProduct.id].length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No reviews submitted yet.</p>
                ) : (
                  reviews[selectedProduct.id].map((rev) => (
                    <div key={rev.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{rev.userName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">✓ Verified Buyer</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-300">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MEDIA / BLOG */}
        {activeTab === 'blog' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-100/90">Official media</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-1">News & engineering notes</h1>
              <p className="text-sm text-zinc-400 mt-2">Updates from the Zortius team. Admins control comments and likes per post.</p>
            </div>
            {selectedBlog ? (
              <article className="space-y-6">
                {(() => { const post = blogPosts.find((x) => x.id === selectedBlog.id) || selectedBlog; return (
                <>
                <button type="button" onClick={() => setSelectedBlog(null)} className="text-xs text-zinc-400 hover:text-zinc-200">← All posts</button>
                <h2 className="text-2xl font-bold text-white">{post.title}</h2>
                <p className="text-xs text-zinc-500">{post.authorName} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-GB') : ''}</p>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.body}</div>
                {post.allowLikes !== false && (
                  <button type="button" onClick={() => handleLikeBlog(post)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 text-xs text-zinc-200 hover:border-cyan-500/50">
                    <ThumbsUp className="w-3.5 h-3.5 text-zinc-100" /> {(post.likes || []).length} likes {sessionUser ? '' : '(sign in)'}
                  </button>
                )}
                {post.allowComments !== false && (
                  <div className="space-y-3 border-t border-zinc-800 pt-4">
                    <h3 className="text-sm font-bold text-white">Comments</h3>
                    {(post.comments || []).map((cm) => (
                      <div key={cm.id} className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs">
                        <span className="font-bold text-zinc-200">{cm.userName}</span>
                        <p className="text-zinc-300 mt-1">{cm.text}</p>
                      </div>
                    ))}
                    {sessionUser ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleBlogComment(post); }} className="flex gap-2">
                        <input value={blogComment} onChange={(e) => setBlogComment(e.target.value)} placeholder="Write a comment…" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
                        <button type="submit" className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs">Post</button>
                      </form>
                    ) : (
                      <p className="text-xs text-zinc-500">Sign in to comment.</p>
                    )}
                  </div>
                )}
                </>
                ); })()}
              </article>
            ) : blogPosts.length === 0 ? (
              <p className="text-sm text-zinc-500 py-12 text-center border border-dashed border-zinc-800 rounded-3xl">No posts yet. Admins can publish from the Admin panel.</p>
            ) : (
              <div className="space-y-4">
                {blogPosts.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedBlog(p)} className="w-full text-left rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 p-5 transition">
                    <h2 className="text-lg font-bold text-white">{p.title}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{p.authorName} · {(p.likes || []).length} likes · {(p.comments || []).length} comments</p>
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{p.body}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FORUM */}
        {activeTab === 'forum' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-100/90">Community</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">Forum</h1>
              <p className="text-sm text-zinc-400 mt-2">Anyone can read. Posting requires sign-in.</p>
            </div>
            {selectedThread ? (
              <div className="space-y-6">
                {(() => { const thread = forumThreads.find((x) => x.id === selectedThread.id) || selectedThread; return (
                <>
                <button type="button" onClick={() => setSelectedThread(null)} className="text-xs text-zinc-400 hover:text-zinc-200">← All threads</button>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                  <div className="flex justify-between gap-2">
                    <h2 className="text-xl font-bold text-white">{thread.title}</h2>
                    {isAdmin && <button type="button" onClick={() => handleDeleteThread(thread.id)} className="text-xs text-rose-400">Delete</button>}
                  </div>
                  <p className="text-xs text-zinc-500">{thread.authorName} · {thread.createdAt ? new Date(thread.createdAt).toLocaleString('en-GB') : ''}</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{thread.body}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Replies ({(thread.replies || []).length})</h3>
                  {(thread.replies || []).map((r) => (
                    <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs">
                      <span className="font-bold text-zinc-200">{r.userName}</span>
                      <p className="text-zinc-300 mt-1 whitespace-pre-wrap">{r.text}</p>
                    </div>
                  ))}
                  {sessionUser ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleForumReply(thread); }} className="space-y-2">
                      <textarea rows={3} value={forumReply} onChange={(e) => setForumReply(e.target.value)} placeholder="Write a reply…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" />
                      <button type="submit" className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs">Reply</button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setProfileModalOpen(true)} className="text-xs text-zinc-100">Sign in to reply</button>
                  )}
                </div>
                </>
                ); })()}
              </div>
            ) : (
              <>
                <form onSubmit={handleCreateThread} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">New thread</h3>
                  {!user && <p className="text-xs text-amber-200">You must be signed in to post.</p>}
                  <input value={forumTitle} onChange={(e) => setForumTitle(e.target.value)} placeholder="Title" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" disabled={!user} />
                  <textarea rows={4} value={forumBody} onChange={(e) => setForumBody(e.target.value)} placeholder="What's on your mind?" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" disabled={!user} />
                  <button type="submit" disabled={!user} className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-sm disabled:opacity-50">Post thread</button>
                </form>
                <div className="space-y-3">
                  {forumThreads.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-10">No threads yet — start the first discussion.</p>
                  ) : forumThreads.map((t) => (
                    <button key={t.id} type="button" onClick={() => setSelectedThread(t)} className="w-full text-left rounded-2xl border border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 p-4 transition">
                      <h2 className="text-base font-bold text-white">{t.title}</h2>
                      <p className="text-xs text-zinc-500 mt-1">{t.authorName} · {(t.replies || []).length} replies</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* COMPARE SPECS */}
        {activeTab === 'compare' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-100/90">Specs</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">Compare systems</h1>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Feature</th>
                    {products.slice(0, 4).map((p) => (
                      <th key={p.id} className="px-4 py-3 text-white font-bold">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-zinc-300">
                  <tr>
                    <td className="px-4 py-3 text-zinc-500">Price</td>
                    {products.slice(0, 4).map((p) => (
                      <td key={p.id} className="px-4 py-3 text-zinc-200 font-bold">£{Number(p.price).toLocaleString('en-GB')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-500">Category</td>
                    {products.slice(0, 4).map((p) => (
                      <td key={p.id} className="px-4 py-3">{p.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-500">Mode</td>
                    {products.slice(0, 4).map((p) => (
                      <td key={p.id} className="px-4 py-3">{p.isPreorder !== false ? 'Pre-order' : 'Standard'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-zinc-500 align-top">Specs</td>
                    {products.slice(0, 4).map((p) => (
                      <td key={p.id} className="px-4 py-3">
                        <ul className="space-y-1 list-disc list-inside">
                          {(p.specs || []).map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* SHIPPING & RETURNS */}
        {activeTab === 'shipping' && (
          <div className="max-w-2xl mx-auto space-y-10">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Policies</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-2">Shipping & returns</h1>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">Clear rules so you know what to expect when orders open.</p>
            </div>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Shipping</h2>
              <ul className="text-sm text-zinc-400 space-y-2 leading-relaxed list-disc list-inside">
                <li>We plan UK-first fulfilment with tracked delivery.</li>
                <li>Pre-order items ship after manufacturing batches — dates shown at purchase when live.</li>
                <li>International shipping may open later; join the newsletter for updates.</li>
              </ul>
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Returns</h2>
              <ul className="text-sm text-zinc-400 space-y-2 leading-relaxed list-disc list-inside">
                <li>Faulty or DOA units: contact support within 14 days of delivery with order ID and photos.</li>
                <li>Change-of-mind returns will follow the policy published at checkout when orders open.</li>
                <li>Custom configured systems may have different return terms.</li>
              </ul>
            </section>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
              <h2 className="text-sm font-semibold text-white">Need help now?</h2>
              <p className="text-xs text-zinc-500">Open Support in the header or email the team from Contact.</p>
              <button type="button" onClick={() => setAiDrawerOpen(true)} className="px-5 py-2.5 rounded-full bg-white text-zinc-950 text-xs font-semibold">Open support</button>
            </section>
          </div>
        )}

        {/* WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-100/90">Saved</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight mt-1">Your list</h1>
              <p className="text-sm text-zinc-400 mt-2">Saved on this device — sign in later to keep exploring.</p>
            </div>
            {wishlist.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-16 border border-dashed border-zinc-800 rounded-3xl">No saved items yet. Heart a product on the shop.</p>
            ) : (
              <div className="space-y-3">
                {wishlist.map((w) => (
                  <div key={w.id} className="flex gap-4 items-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                    <img src={w.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-zinc-950" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{w.name}</p>
                      <p className="text-xs text-zinc-100">£{Number(w.price).toLocaleString('en-GB')}</p>
                    </div>
                    <button type="button" onClick={() => { const p = products.find((x) => x.id === w.id); if (p) openProduct(p); }} className="text-xs text-zinc-100 font-semibold">View</button>
                    <button type="button" onClick={() => toggleWishlist(w)} className="text-xs text-zinc-500">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CART */}
        {activeTab === 'cart' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-extrabold text-white mb-2">Shopping Basket</h1>
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800">
                <ShoppingCart className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-zinc-300">Your basket is empty</h3>
                <button onClick={() => setActiveTab('shop')} className="mt-4 px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-sm cursor-pointer">
                  Return to Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 divide-y divide-slate-800 overflow-hidden shadow-2xl">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedColor}`} className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-zinc-950 border border-zinc-800 flex-shrink-0" />
                        <div>
                          <h3 className="text-base font-bold text-white">{renderSafe(item.name)}</h3>
                          <span className="text-xs font-mono text-zinc-200 block">{item.selectedColor}</span>
                          <span className="text-sm font-semibold text-zinc-100">£{Number(item.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                          <button onClick={() => updateCartQty(item.id, item.selectedColor, -1)} className="text-zinc-400 hover:text-white cursor-pointer">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center">{renderSafe(item.qty)}</span>
                          <button onClick={() => updateCartQty(item.id, item.selectedColor, 1)} className="text-zinc-400 hover:text-white cursor-pointer">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.selectedColor)} className="text-zinc-500 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900/80 rounded-3xl border border-zinc-800 p-8 space-y-6 shadow-2xl">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="PROMO CODE" value={appliedCode} onChange={(e) => setAppliedCode(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs uppercase text-white flex-1 outline-none" />
                      <button onClick={handleApplyDiscount} className="bg-slate-800 hover:bg-slate-700 text-zinc-200 text-xs px-4 py-2 rounded-xl font-bold cursor-pointer">
                        Apply
                      </button>
                    </div>
                    {discountError && <p className="text-[11px] text-rose-400">{discountError}</p>}
                    {appliedDiscount && <p className="text-[11px] text-emerald-400 font-bold">✓ Applied {appliedDiscount.code}!</p>}
                  </div>
                  <div className="space-y-3 text-sm pt-4 border-t border-zinc-800">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount</span>
                        <span>-£{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-zinc-800 flex justify-between text-lg font-black text-white">
                      <span>Total</span>
                      <span>£{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={handleInitiateCheckout} className="w-full py-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-base transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Lock className="w-5 h-5" /> Proceed to Secure Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS HISTORY (customer) */}
        {activeTab === 'orders' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-extrabold text-white mb-2">Order History</h1>
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800">
                <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-zinc-300">No order history found</h3>
                <button onClick={() => setActiveTab('shop')} className="mt-4 px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-sm cursor-pointer">
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white font-mono">{renderSafe(order.id)}</span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : order.status === 'Shipped'
                                  ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                                  : order.status === 'Canceled'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {renderSafe(order.status || 'Processing')}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 mt-1 block">
                          Placed on {renderSafe(order.date)} via {renderSafe(order.paymentMethod)}
                        </span>
                        {order.shippingAddress && <span className="text-xs text-zinc-400 mt-1 block">Ship to: {order.shippingAddress}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-500 block">Total</span>
                        <span className="text-xl font-black text-white">£{Number(order.total).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    {Array.isArray(order.items) && (
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs">
                            {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                            <div>
                              <span className="font-bold text-white">{item.name}</span>
                              <span className="text-zinc-200 ml-2">{item.selectedColor}</span>
                              <span className="text-zinc-400 ml-2">
                                ×{item.qty} · £{(item.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div className="col-span-2 md:col-span-1 space-y-4">
                <p className="text-sm font-semibold text-white tracking-tight">Zortius</p>
                <p className="text-xs text-zinc-500 leading-relaxed">Hardware for people who measure twice. Workstations, displays, and tools with honest specs.</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">Explore</p>
                <div className="flex flex-col gap-2 text-xs text-zinc-400">
                  <button type="button" onClick={() => navigateTo('shop', '/shop')} className="text-left hover:text-white transition">Shop</button>
                  <button type="button" onClick={() => navigateTo('compare', '/compare')} className="text-left hover:text-white transition">Compare</button>
                  <button type="button" onClick={() => navigateTo('blog', '/blog')} className="text-left hover:text-white transition">Media</button>
                  <button type="button" onClick={() => navigateTo('forum', '/forum')} className="text-left hover:text-white transition">Forum</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">Company</p>
                <div className="flex flex-col gap-2 text-xs text-zinc-400">
                  <button type="button" onClick={() => navigateTo('about', '/about')} className="text-left hover:text-white transition">About</button>
                  <button type="button" onClick={() => navigateTo('applications', '/careers')} className="text-left hover:text-white transition">Careers</button>
                  <button type="button" onClick={() => navigateTo('faq', '/faq')} className="text-left hover:text-white transition">FAQ</button>
                  <button type="button" onClick={() => navigateTo('shipping', '/shipping')} className="text-left hover:text-white transition">Shipping</button>
                  <button type="button" onClick={() => navigateTo('contact', '/contact')} className="text-left hover:text-white transition">Contact</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">Newsletter</p>
                <form onSubmit={handleNewsletterSignup} className="space-y-2">
                  <input type="email" required value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Email" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-zinc-500" />
                  <button type="submit" disabled={newsletterBusy} className="w-full py-2 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50">{newsletterBusy ? '…' : 'Subscribe'}</button>
                </form>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-zinc-900 text-[11px] text-zinc-600">
              <span>© {new Date().getFullYear()} Zortius. All rights reserved.</span>
              <div className="flex gap-4">
                <button type="button" onClick={() => navigateTo('privacy', '/privacy')} className="hover:text-zinc-400">Privacy</button>
                <button type="button" onClick={() => navigateTo('terms', '/terms')} className="hover:text-zinc-400">Terms</button>
                <button type="button" onClick={() => setCmdOpen(true)} className="hover:text-zinc-400">Menu</button>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* CHECKOUT MODAL — proper address + Stripe */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setCheckoutModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold text-white">Checkout unavailable</h3>
            </div>
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100 leading-relaxed">
              <p className="font-bold text-amber-200 mb-1">Pre-orders are not open yet.</p>
              <p>We are not accepting payments yet. Your basket is saved. Join the pre-order list from the Shop or Home page to be notified at launch.</p>
            </div>
            <p className="text-xs text-zinc-400">
              Basket total: <strong className="text-white">£{grandTotal.toFixed(2)}</strong>
            </p>
            <button type="button" onClick={() => setCheckoutModalOpen(false)} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">
              Back to basket
            </button>
          </div>
        </div>
      )}

            {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                if (otpGateActive) {
                  // Must verify or sign out — cannot dismiss gate
                  return;
                }
                setProfileModalOpen(false);
                setAuthError('');
                setEmail('');
                setPassword('');
                setForgotMode(false);
                setForgotSent(false);
                setVerifyMode(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {sessionUser ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-zinc-100" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Your Account</h3>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Profile details</p>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Display name</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Phone</label>
                    <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+44…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Company / school</label>
                    <input type="text" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} placeholder="Optional" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Location</label>
                    <input type="text" value={profileLocation} onChange={(e) => setProfileLocation(e.target.value)} placeholder="City, country" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Bio</label>
                    <textarea rows="2" value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Short intro…" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await saveUserDataToFirestore(cart, orders, userName);
                      showNotification('Profile saved');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm"
                  >
                    Save profile
                  </button>
                </div>
                {isAdmin && (
                  <div className="rounded-xl bg-zinc-800 border border-zinc-600 p-3 text-xs text-zinc-200">
                    You are logged in as <strong>{isFullAdmin ? 'Full Admin' : 'Limited Admin'}</strong>
                  </div>
                )}
                <div className="space-y-2 border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    onClick={() => { setProfileModalOpen(false); navigateTo('orders', '/account/orders'); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 hover:border-zinc-600 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2"><Package className="w-4 h-4 text-zinc-100" /> Order history</span>
                    <span className="text-xs text-zinc-500">{orders.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileModalOpen(false); setContactModalOpen(true); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 hover:border-zinc-600 flex items-center gap-2"
                  >
                    <Headphones className="w-4 h-4 text-zinc-100" /> Contact support
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { setProfileModalOpen(false); navigateTo('admin', '/admin'); }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-600 text-sm text-zinc-200 font-bold"
                    >
                      Admin panel
                    </button>
                  )}
                </div>
                <button onClick={handleSignOut} className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-sm flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {verifyMode ? (
                  <>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white">Enter verification code</h3>
                      <p className="text-xs text-zinc-400 mt-1">You are not signed in until you enter the code sent to <span className="text-zinc-200">{pendingVerifyEmail || email}</span></p>
                      <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">Check <strong>Inbox</strong>, <strong>Junk / Spam</strong>, and <strong>Promotions</strong>. Subject looks like “Zortius code 123456”.</p>
                    </div>
                    <form onSubmit={handleVerifyCodeSubmit} className="space-y-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                      {authError && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{authError}</div>}
                      <button type="submit" disabled={authSubmitting} className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm disabled:opacity-60">
                        {authSubmitting ? 'Checking…' : 'Verify email'}
                      </button>
                      <button type="button" disabled={authSubmitting} onClick={handleResendVerifyCode} className="w-full text-xs text-zinc-100 hover:text-zinc-200">
                        Resend code
                      </button>
                      <button type="button" onClick={handleResendVerifyCode} className="w-full text-xs text-zinc-100 hover:text-zinc-200" disabled={authSubmitting}>
                        Resend code
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          clearOtpUnlocked(user?.uid);
                          setOtpGateActive(false);
                          setVerifyMode(false);
                          if (auth) await signOut(auth);
                        }}
                        className="w-full text-xs text-zinc-500 hover:text-white"
                      >
                        Cancel and sign out
                      </button>
                    </form>
                  </>
                ) : (
                <>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{authMode === 'login' ? 'Sign in to continue' : 'Join Zortius'}</p>
                </div>
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authMode === 'login' ? 'bg-white text-zinc-950' : 'text-zinc-400'}`}>
                    Login
                  </button>
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authMode === 'signup' ? 'bg-white text-zinc-950' : 'text-zinc-400'}`}>
                    Sign Up
                  </button>
                </div>
                <form onSubmit={authMode === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    Remember me
                  </label>
                  {authError && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{authError}</div>}
                  <button type="submit" disabled={authSubmitting} className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {authSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
                {!forgotMode ? (
                  <>
                    <button type="button" onClick={() => { setForgotMode(true); setAuthError(''); setForgotSent(false); }} className="w-full text-center text-xs text-zinc-100 hover:text-zinc-200">
                      Forgot password?
                    </button>
                    <button onClick={handleGoogleSignIn} disabled={authSubmitting} className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-slate-800 border border-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2">
                      Continue with Google
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                      On phones, Google opens a secure page then returns you here signed in. Use the same browser — not private mode.
                    </p>
                  </>
                ) : (
                  <div className="space-y-3 border-t border-zinc-800 pt-4">
                    <p className="text-sm font-bold text-white">Reset password</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      We email a reset link to your address. We cannot see or send your current password — it is encrypted and only you can set a new one.
                    </p>
                    {forgotSent ? (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                        Reset email sent to <strong>{email}</strong>. Check inbox and spam. Then sign in with the new password.
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Account email" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                        {authError && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{authError}</div>}
                        <button type="submit" disabled={authSubmitting} className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm disabled:opacity-60">
                          {authSubmitting ? 'Sending…' : 'Send reset email'}
                        </button>
                      </form>
                    )}
                    <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setAuthError(''); }} className="w-full text-center text-xs text-zinc-400 hover:text-white">
                      ← Back to sign in
                    </button>
                    <button type="button" onClick={() => { setProfileModalOpen(false); setContactModalOpen(true); setForgotMode(false); }} className="w-full text-center text-xs text-zinc-100 hover:text-zinc-200">
                      Still stuck? Contact support
                    </button>
                  </div>
                )}
                </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
