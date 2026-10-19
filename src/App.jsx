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
const SUPPORT_EMAIL = 'help.zortius@outlook.com';

const renderSafe = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return fallback;
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'zortius-store-v2';
const firebaseConfig = {
  apiKey: 'AIzaSyBhsCLWDETaqh1zytvnNt33O8Lls63mna0',
  authDomain: 'zortiusweb1.firebaseapp.com',
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
    description:
      'Engineered for extreme computational demands. Features bespoke liquid immersion cooling, redundant power architectures, and uncompromised multi-threaded throughput for professional simulation and rendering.',
    specs: ['64-Core Thread Processor', '128GB ECC DDR5 RAM', 'Dual PCIe Gen 5 Workstation Graphics', '4TB NVMe Ultra-Dense Storage'],
    options: { colors: ['Dark Anodized', 'Titanium Silver'] }
  },
  {
    id: 'zort-core-pro',
    name: 'ZORTIUS Core Pro Desktop Chassis',
    category: 'Desktops',
    price: 1899.0,
    rating: 4.8,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    description:
      'Precision-milled anodized aluminum chassis paired with acoustically optimized thermal tunnels. Built for pristine signal integrity and silent operation under heavy sustained workloads.',
    specs: ['Acoustically Tuned Airflow', 'Modular Toolless Bays', 'Anodized Gunmetal Finish', 'Integrated Cable Routing Matrix'],
    options: { colors: ['Gunmetal Black', 'Matte White'] }
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
    specs: ['3840 x 2160 Resolution', '165Hz Refresh Rate', 'Mini-LED Local Dimming', 'Factory Calibrated Delta E < 1']
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
    specs: ['Hot-Swappable PCB', 'CNC Machined Aluminum Case', 'PBT Double-Shot Keycaps', 'Tri-Mode Wireless Connectivity']
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
  const [prodColorOption, setProdColorOption] = useState('Default');

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

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

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
        setIsAdmin(em === ADMIN_EMAIL.toLowerCase() || em === LIMITED_ADMIN_EMAIL.toLowerCase());
        setIsFullAdmin(em === ADMIN_EMAIL.toLowerCase());
        setContactEmail(currentUser.email || '');
        setContactName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
        setShipFullName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      } else {
        setUserId(null);
        setUserName('');
        setIsAdmin(false);
        setIsFullAdmin(false);
      }
      setAuthLoading(false);
    };

    (async () => {
      try {
        // Must run on every load — this is how phone Google login finishes
        await setPersistence(auth, browserLocalPersistence);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          applyUser(result.user);
          setProfileModalOpen(false);
          setNotification({ message: 'Signed in with Google successfully.', type: 'success' });
          setTimeout(() => setNotification(null), 3500);
        }
      } catch (err) {
        console.error('getRedirectResult error:', err);
        if (err?.code === 'auth/unauthorized-domain') {
          setNotification({
            message: 'Domain not authorized in Firebase. Add zortius.vercel.app under Auth → Settings.',
            type: 'error'
          });
          setTimeout(() => setNotification(null), 6000);
        }
      }

      // Primary listener — keeps session across refreshes
      unsub = onAuthStateChanged(auth, (currentUser) => {
        applyUser(currentUser);
      });

      // Extra check: if redirect user is already on auth but listener was late
      if (auth.currentUser) {
        applyUser(auth.currentUser);
      }
    })();

    return () => unsub();
  }, []);

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
    return 'home';
  };

  const navigateTo = (tab, path) => {
    setActiveTab(tab);
    setSelectedProduct(null);
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
        { cart: updatedCart, orders: updatedOrders, displayName: customName, updatedAt: new Date().toISOString() },
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
      subject:
        orderId && String(orderId).startsWith('APPLICATION-')
          ? `Zortius application – ${statusVal || 'Received'}`
          : orderId
            ? `Order Receipt #${orderId} - ZORTIUS`
            : 'Technical Inquiry Support',
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
  const handleEmailSignUp = async (e) => {
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
        await createUserWithEmailAndPassword(auth, email, password);
        const name = email.split('@')[0];
        setUserName(name);
        await saveUserDataToFirestore(cart, orders, name);
        showNotification('Account created successfully!');
        setProfileModalOpen(false);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
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
        showNotification('Signed in successfully.');
        setProfileModalOpen(false);
        setEmail('');
        setPassword('');
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
        setAuthError('Auth is not ready. Refresh the page and try again.');
        return;
      }
      // Always local persistence so session survives Google redirect
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope('email');
      provider.addScope('profile');

      // Redirect works on phone AND laptop when popup storage is blocked
      await signInWithRedirect(auth, provider);
      // Browser leaves this page; when it returns, getRedirectResult completes login
    } catch (err) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';
      const msg = (err?.message || '').replace('Firebase: ', '');
      if (code === 'auth/unauthorized-domain') {
        setAuthError('Add zortius.vercel.app in Firebase → Authentication → Settings → Authorized domains.');
      } else {
        setAuthError(msg || 'Google sign-in failed. Try again.');
      }
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth);
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
            p.description.toLowerCase().includes(aiQuery.toLowerCase())
        ) || products[0];
      setAiResponse({
        recommendation: matched,
        explanation: `Based on your requirements ("${aiQuery}"), the ${matched.name} delivers maximum throughput and zero-throttle reliability for your specific workflow.`
      });
      setIsAiThinking(false);
    }, 1200);
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
    const payload = {
      name: prodName,
      price: parseFloat(prodPrice),
      category: prodCategory,
      image: prodImage || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80',
      description: prodDesc || 'High-performance computing component.',
      rating: 5.0,
      reviewsCount: 1,
      specs: ['ZORTIUS Certified', 'High Throughput'],
      options: { colors: [prodColorOption || 'Default'] }
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
    setProdDesc('');
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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-bounce ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-slate-900/90 border-cyan-500/50 text-cyan-200'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle className="w-5 h-5 text-cyan-400" />}
          <span className="text-sm font-medium">{renderSafe(notification.message)}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home', '/')}>
              <div className="relative w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                  ZORTIUS
                </span>
                <span className="block text-[10px] tracking-widest text-cyan-500 font-semibold uppercase">Hardware Engineering</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-7">
              {[
                { tab: 'home', path: '/', label: 'Home' },
                { tab: 'shop', path: '/shop', label: 'Shop' },
                { tab: 'applications', path: '/careers', label: 'Careers' },
                { tab: 'contact', path: '/contact', label: 'Support' },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    if (item.tab === 'contact') { setContactModalOpen(true); return; }
                    navigateTo(item.tab, item.path);
                  }}
                  className={`relative text-[13px] font-medium tracking-wide transition-colors hover:text-white pb-1 ${
                    activeTab === item.tab ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                  {activeTab === item.tab && item.tab !== 'contact' && (
                    <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin', '/admin')}
                  className={`relative text-[13px] font-semibold tracking-wide transition-colors hover:text-cyan-300 pb-1 ${
                    activeTab === 'admin' ? 'text-cyan-400' : 'text-cyan-600'
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
                className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Bot className="w-4 h-4" /> <span className="hidden sm:inline">AI Configurator</span>
              </button>

              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-slate-200 line-clamp-1">{renderSafe(userName, 'Sign In')}</span>
                  <span className={`block text-[10px] font-medium ${user ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {user ? '● Signed In' : '○ Click to Login'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigateTo('cart', '/cart')}
                className="relative p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-cyan-400 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">Basket</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-slate-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      
        {/* MOBILE NAV */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl">
            <nav className="px-4 py-3 flex flex-col gap-0.5">
              {[
                { tab: 'home', path: '/', label: 'Home' },
                { tab: 'shop', path: '/shop', label: 'Shop' },
                { tab: 'applications', path: '/careers', label: 'Careers' },
                { tab: 'orders', path: '/account/orders', label: `Orders (${orders.length})` },
                { tab: 'about', path: '/about', label: 'About' },
                { tab: 'faq', path: '/faq', label: 'FAQ' },
              ].map((item) => (
                <button key={item.tab} type="button" onClick={() => navigateTo(item.tab, item.path)} className={`text-left px-4 py-3.5 rounded-xl text-sm font-medium ${activeTab === item.tab ? 'bg-white/5 text-white' : 'text-slate-300'}`}>{item.label}</button>
              ))}
              <button type="button" onClick={() => { setContactModalOpen(true); setMobileMenuOpen(false); }} className="text-left px-4 py-3.5 rounded-xl text-sm font-medium text-slate-300">Contact Support</button>
              {isAdmin && <button type="button" onClick={() => navigateTo('admin', '/admin')} className={`text-left px-4 py-3.5 rounded-xl text-sm font-bold ${activeTab === 'admin' ? 'text-cyan-400' : 'text-cyan-500'}`}>Admin</button>}
              <button type="button" onClick={() => { setProfileModalOpen(true); setMobileMenuOpen(false); }} className="text-left px-4 py-3.5 rounded-xl text-sm font-medium text-slate-300">{user ? 'Account' : 'Sign In'}</button>
            </nav>
          </div>
        )}

      </header>

      {/* CONTACT MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            <button onClick={() => setContactModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <Headphones className="w-5 h-5" />
                <h3 className="text-lg font-extrabold text-white">Contact ZORTIUS Support</h3>
              </div>
              <p className="text-xs text-slate-400">
                Support Desk: <strong>{SUPPORT_EMAIL}</strong>
              </p>
            </div>
            <form onSubmit={handleSendContactInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Inquiry</label>
                <textarea
                  rows="4"
                  required
                  value={contactInquiry}
                  onChange={(e) => setContactInquiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSendingContact}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">AI Hardware Configurator</h3>
                </div>
                <button onClick={() => setAiDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400">Describe your workload and the ZORTIUS AI will recommend optimal compute hardware.</p>
              <form onSubmit={handleAskAi} className="space-y-3">
                <textarea
                  rows="3"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Describe your engineering requirement..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isAiThinking}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  {isAiThinking ? 'Analyzing Compute Requirements...' : 'Generate AI Hardware Spec'}
                </button>
              </form>
              {aiResponse && (
                <div className="bg-slate-950 border border-cyan-500/30 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Recommendation Result</span>
                  <h4 className="text-sm font-bold text-white">{aiResponse.recommendation.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiResponse.explanation}</p>
                  <button
                    onClick={() => {
                      setSelectedProduct(aiResponse.recommendation);
                      if (aiResponse.recommendation.options?.colors?.length) setSelectedColor(aiResponse.recommendation.options.colors[0]);
                      setActiveTab('shop');
                      setAiDrawerOpen(false);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold py-2 rounded-lg border border-cyan-500/30 cursor-pointer"
                  >
                    View Recommended Spec
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ADMIN */}
        {isAdmin && activeTab === 'admin' && (
          <div className="space-y-10">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-3xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-base font-bold text-cyan-300">ADMIN CONTROL CENTER</h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    {isFullAdmin ? `Full Admin · ${ADMIN_EMAIL}` : `Limited Admin · ${LIMITED_ADMIN_EMAIL} (no order management)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Applications Studio */}
            <section className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 space-y-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-cyan-400" /> Applications Studio
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Create role sections, build forms, review scores and make the final decision.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Forms', value: jobApplications.length },
                    { label: 'Pending', value: applicationSubmissions.filter((x) => !['Accepted', 'Denied'].includes(x.status)).length },
                    { label: 'Reviewed', value: applicationSubmissions.filter((x) => ['Accepted', 'Denied'].includes(x.status)).length }
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-slate-950 border border-slate-800 px-4 py-3">
                      <div className="text-xl font-black text-cyan-300">{stat.value}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" /> 1. Manage sections
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Examples: Leadership, Marketing, Product Development, General Staff.</p>
                  </div>
                  <form onSubmit={handleCreateSection} className="flex gap-2">
                    <input
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      required
                      placeholder="New section name"
                      className="min-w-0 flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <button className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm">Add</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {applicationSections.map((section) => (
                      <span key={section.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 pl-3 pr-1.5 py-1.5 text-xs text-slate-200">
                        {section.name}
                        <button type="button" title="Delete section" onClick={() => handleDeleteSection(section.id, section.name)} className="p-1 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {!applicationSections.length && <p className="text-xs text-slate-500">No sections yet — create your first one above.</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" /> 2. Build an application
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Add questions, assign marks and publish the form.</p>
                  </div>
                  <form onSubmit={handleSaveApplication} className="space-y-3">
                    <input
                      value={appTitle}
                      onChange={(e) => setAppTitle(e.target.value)}
                      required
                      placeholder="Application title (e.g. Head of Marketing)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <select
                      value={appSection}
                      onChange={(e) => setAppSection(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <div className="rounded-xl border border-slate-800 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-300">Questions ({appQuestions.length})</span>
                        <span className="text-xs text-cyan-300">Total marks: {appQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)}</span>
                      </div>
                      {appQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-2 bg-slate-900 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                              {i + 1}. {q.question}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {q.type} · {q.marks} marks · {q.required ? 'Required' : 'Optional'}
                            </p>
                          </div>
                          <button type="button" onClick={() => setAppQuestions((prev) => prev.filter((item) => item.id !== q.id))} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <textarea
                        value={questionDraft}
                        onChange={(e) => setQuestionDraft(e.target.value)}
                        rows="2"
                        placeholder="Write a question…"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white">
                          <option value="short">Short answer</option>
                          <option value="long">Long answer</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                        </select>
                        <input type="number" min="0" max="100" value={questionMarks} onChange={(e) => setQuestionMarks(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white" />
                        <label className="flex items-center gap-2 text-xs text-slate-400">
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
                    <button type="submit" className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm py-3">
                      {editingApplicationId ? 'Save changes' : 'Publish application'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white">Published applications</h4>
                {jobApplications.length === 0 ? (
                  <p className="text-sm text-slate-500">No applications published yet.</p>
                ) : (
                  jobApplications.map((application) => (
                    <div key={application.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-950 border border-slate-800 p-4">
                      <div>
                        <p className="font-bold text-white">{application.title}</p>
                        <p className="text-xs text-slate-500">
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
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400"
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
                          className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10"
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
                    <select value={applicationFilter} onChange={(e) => setApplicationFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                      <option>Pending</option>
                      <option>Accepted</option>
                      <option>Denied</option>
                      <option>All</option>
                    </select>
                    <input
                      value={applicationSearch}
                      onChange={(e) => setApplicationSearch(e.target.value)}
                      placeholder="Search applicants…"
                      className="w-44 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
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
                    <div key={submission.id} className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">
                            {submission.applicantName} <span className="text-xs font-normal text-slate-500">· {submission.applicantEmail}</span>
                          </p>
                          <p className="text-sm text-cyan-300 mt-1">
                            {submission.applicationTitle} · {submission.section}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Submitted {new Date(submission.submittedAt).toLocaleString('en-GB')}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-xs">{submission.status || 'Pending'}</span>
                          <span className="text-sm font-bold text-white">
                            {submission.preliminaryMark?.score ?? '—'} / {submission.preliminaryMark?.maxScore ?? '—'}{' '}
                            <span className="text-xs font-normal text-slate-500">preliminary</span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {(submission.questions || []).map((q, i) => (
                          <div key={q.id} className="rounded-xl bg-slate-900 p-3">
                            <p className="text-xs font-bold text-slate-300">
                              {i + 1}. {q.question} <span className="text-cyan-300">({q.marks} marks)</span>
                            </p>
                            <p className="text-sm text-slate-200 whitespace-pre-wrap mt-2">{submission.answers?.[q.id] || 'No answer'}</p>
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
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 text-sm font-black flex items-center gap-2"
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
                <p className="text-[11px] text-slate-500">
                  Scoring note: configure VITE_AI_MARKING_ENDPOINT on a secure server for genuine AI-assisted marking. Without it, scores are only basic answer-completeness estimates. All scores require human review.
                </p>
              </div>
            </section>

            {/* Product CRUD */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Global Store Products
              </h3>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Product Name" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                <input type="number" step="0.01" placeholder="Price (£)" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none font-mono" />
                <input type="text" placeholder="Category" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                <input type="url" placeholder="Image URL" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none md:col-span-2" />
                <input type="text" placeholder="Color Option" value={prodColorOption} onChange={(e) => setProdColorOption(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none" />
                <textarea placeholder="Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows="2" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none md:col-span-3" />
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs md:col-span-3 cursor-pointer">
                  {editingProductId ? 'Update Product' : 'Add Product to Live Store'}
                </button>
              </form>
              <div className="divide-y divide-slate-800 pt-4">
                {products.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-cyan-400 font-mono ml-3">£{p.price}</span>
                      {p.options?.colors && <span className="text-slate-500 ml-2">[{p.options.colors.join(', ')}]</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProdName(p.name);
                          setProdPrice(p.price);
                          setProdCategory(p.category);
                          setProdImage(p.image);
                          setProdDesc(p.description || '');
                          setProdColorOption(p.options?.colors?.[0] || 'Default');
                        }}
                        className="text-slate-400 hover:text-cyan-400 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Discount Engine */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" /> Global Promo & Discount Codes
              </h3>
              <form onSubmit={handleAddDiscount} className="flex gap-3">
                <input type="text" placeholder="CODE (e.g. ZORT20)" required value={discCode} onChange={(e) => setDiscCode(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs uppercase text-white flex-1 outline-none" />
                <input type="number" placeholder="Value" required value={discVal} onChange={(e) => setDiscVal(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white w-28 outline-none" />
                <select value={discType} onChange={(e) => setDiscType(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="percent">% Off</option>
                  <option value="fixed">£ Off</option>
                </select>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer">
                  Create
                </button>
              </form>
              <div className="flex flex-wrap gap-2 pt-2">
                {discounts.map((d) => (
                  <div key={d.id} className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{d.code}</span>
                    <span className="text-slate-400">({d.percent ? `${d.percent}% OFF` : `£${d.fixed} OFF`})</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ORDERS — FULL ADMIN ONLY */}
            {isFullAdmin && (
              <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <PackageCheck className="w-4 h-4" /> Comprehensive Customer Orders Management
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs">
                    Total Orders Logged: <strong>{orders.length}</strong>
                  </span>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono">No customer orders recorded yet.</p>
                ) : (
                  <div className="space-y-6">
                    {orders.map((o) => (
                      <div key={o.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-5 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Order Ref & Client</span>
                            <span className="font-mono font-black text-white text-sm block">{o.id}</span>
                            <span className="text-slate-300 block font-medium mt-0.5">{o.customerName || 'Customer'}</span>
                            <span className="text-slate-500 block font-mono text-[11px]">{o.customerEmail}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Shipping & Metadata</span>
                            <div className="space-y-1 text-slate-300 font-mono">
                              <span className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
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
                                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Placed: {o.date || 'Today'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Gateway: {o.paymentMethod || 'Stripe'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col justify-between items-start md:items-end">
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">Order Status Control</span>
                            <select
                              value={o.status || 'Processing'}
                              onChange={(e) => handleUpdateOrderStatus(o, e.target.value)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
                                o.status === 'Delivered'
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                                  : o.status === 'Shipped'
                                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
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
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" /> Order Manifest ({Array.isArray(o.items) ? o.items.length : 0} items)
                          </span>
                          <div className="bg-slate-900/80 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                            {Array.isArray(o.items) &&
                              o.items.map((item, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0" />}
                                    <div>
                                      <span className="font-bold text-slate-100 block">{item.name}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                        <span>Category: {item.category || 'Hardware'}</span>
                                        <span>•</span>
                                        <span className="text-cyan-300 font-semibold">Finish: {item.selectedColor || 'Standard'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="text-xs text-slate-300 font-bold block">
                                      £{(item.price || 0).toFixed(2)} × {item.qty || 1}
                                    </span>
                                    <span className="text-[10px] text-cyan-400 font-semibold">Subtotal: £{((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 font-mono text-xs">
                          <div className="text-slate-400 space-x-3">
                            <span>
                              Subtotal: <strong>£{(o.subtotal || o.total || 0).toFixed(2)}</strong>
                            </span>
                            {o.discountAmount > 0 && (
                              <span className="text-emerald-400">
                                Discount: <strong>-£{o.discountAmount.toFixed(2)}</strong>
                              </span>
                            )}
                          </div>
                          <span className="text-slate-200">
                            Paid Total: <strong className="text-cyan-400 text-sm font-black">£{Number(o.total || 0).toFixed(2)}</strong>
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
            <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/50 p-8 sm:p-12">
              <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full border border-cyan-400/10" />
              <div className="relative max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                  <Users className="w-4 h-4" /> JOIN THE TEAM
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-white">
                  Build what's next at <span className="text-cyan-400">Zortius.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300">
                  Explore open roles, tell us what you bring to the team, and track the application process. Every application is reviewed by a member of our team.
                </p>
              </div>
            </section>

            {selectedApplication ? (
              <section className="max-w-3xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-9 space-y-6">
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                    navigateTo('applications', '/careers');
                  }}
                  className="text-sm text-cyan-300 hover:text-cyan-200"
                >
                  ← All applications
                </button>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{selectedApplication.section}</span>
                  <h2 className="mt-2 text-3xl font-black text-white">{selectedApplication.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {selectedApplication.description || 'Complete the questions below to apply for this opportunity at Zortius.'}
                  </p>
                </div>
                <div className="flex gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-300">
                  <Shield className="w-5 h-5 shrink-0 text-cyan-300" />
                  <p>Your answers are shared with the Zortius team for application review. You will receive an email confirmation after submitting.</p>
                </div>
                <form onSubmit={handleSubmitApplication} className="space-y-5">
                  {(selectedApplication.questions || []).map((q, i) => (
                    <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                      <label className="block text-sm font-bold text-white">
                        {i + 1}. {q.question}
                        {q.required && <span className="text-rose-400"> *</span>}
                        <span className="block mt-1 text-xs font-normal text-slate-500">
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
                          className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      ) : (
                        <input
                          type={q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text'}
                          required={q.required}
                          value={applicationAnswers[q.id] || ''}
                          onChange={(e) => setApplicationAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Your answer…"
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">Signed in as {user?.email || 'not signed in'}. You must sign in to submit.</p>
                    <button disabled={applicationSubmitting} className="rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 px-6 py-3.5 text-sm font-black text-slate-950">
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
                          <p className="text-sm text-slate-400 mt-1">Opportunities in {section.name.toLowerCase()}.</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {sectionApps.length} open {sectionApps.length === 1 ? 'role' : 'roles'}
                        </span>
                      </div>
                      {sectionApps.length ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {sectionApps.map((a) => (
                            <article key={a.id} className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 hover:border-cyan-500/40 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-cyan-300">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300">Open</span>
                              </div>
                              <h3 className="mt-4 text-lg font-black text-white">{a.title}</h3>
                              <p className="mt-2 text-sm text-slate-400 line-clamp-3">{a.description || 'Apply to join the Zortius team and help us build great things.'}</p>
                              <div className="mt-5 flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-400">
                                  {(a.questions || []).length} questions · ~{Math.max(5, Math.round((a.questions || []).length * 1.5))} mins
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(a);
                                    setApplicationAnswers({});
                                    navigateTo('applications', `/careers/${a.slug || a.id}`);
                                  }}
                                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-black text-slate-950 group-hover:bg-cyan-400"
                                >
                                  View & apply <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-slate-800 p-5 text-sm text-slate-500">No open roles in this section yet.</p>
                      )}
                    </section>
                  );
                })}
                {!applicationSections.length && (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
                    <Layers className="w-10 h-10 mx-auto text-slate-600" />
                    <h2 className="mt-4 font-bold text-white">Applications are coming soon</h2>
                    <p className="mt-2 text-sm text-slate-500">There are no published opportunities at the moment. Please check back later.</p>
                  </div>
                )}
                {user && (
                  <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <h3 className="font-bold text-white">Your application history</h3>
                    {applicationSubmissions.filter((x) => x.applicantUid === user.uid).length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">You have not submitted an application yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {applicationSubmissions
                          .filter((x) => x.applicantUid === user.uid)
                          .map((x) => (
                            <div key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950 p-3">
                              <div>
                                <p className="text-sm font-bold text-white">{x.applicationTitle}</p>
                                <p className="text-xs text-slate-500">{new Date(x.submittedAt).toLocaleDateString('en-GB')}</p>
                              </div>
                              <span className="text-xs font-bold text-cyan-300">{x.status || 'Pending'}</span>
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
            <button onClick={() => navigateTo('shop', '/shop')} className="text-sm text-cyan-300 hover:text-cyan-200">
              ← Back to store
            </button>
            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">ZORTIUS · Hardware Engineering</span>
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
                <p className="mt-4 text-slate-300 leading-relaxed">
                  Zortius is focused on technology, thoughtful product design and engineering-led ideas. Our aim is to make useful technology approachable, reliable and exciting.
                </p>
              )}
              {activeTab === 'faq' && (
                <div className="mt-5 space-y-4 text-sm text-slate-300">
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
                    <p className="mt-1">Email {SUPPORT_EMAIL}.</p>
                  </div>
                </div>
              )}
              {activeTab === 'privacy' && (
                <p className="mt-4 text-slate-300 leading-relaxed">
                  Zortius only collects information needed to operate accounts, process orders and review applications.
                </p>
              )}
              {activeTab === 'terms' && (
                <p className="mt-4 text-slate-300 leading-relaxed">Draft terms placeholder. Publish final purchase, delivery and returns terms before accepting real orders.</p>
              )}
              {activeTab === 'account' && (
                <div className="mt-5 space-y-3">
                  <p className="text-slate-300">{user ? `Signed in as ${user.email}` : 'Sign in to manage your account and applications.'}</p>
                  <button onClick={() => setProfileModalOpen(true)} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950">
                    {user ? 'Account settings' : 'Sign in / create account'}
                  </button>
                </div>
              )}
              {activeTab === 'contact' && (
                <div className="mt-5 space-y-3">
                  <p className="text-slate-300">For help with orders, accounts or applications, contact our support team.</p>
                  <a className="text-cyan-300 underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                  <div>
                    <button onClick={() => setContactModalOpen(true)} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950">
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
            <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-16 sm:px-12 sm:py-24 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_55%)]" />
              <div className="relative max-w-3xl mx-auto">
                <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-cyan-400/90 mb-4">Zortius Hardware</p>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white leading-[1.05]">
                  Engineered for<br className="hidden sm:block" /> what comes next.
                </h1>
                <p className="mt-5 sm:mt-6 text-base sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Workstations, displays, and precision peripherals — designed with the same clarity you expect from the best in the industry.
                </p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button type="button" onClick={() => navigateTo('shop', '/shop')} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition">
                    Shop collection
                  </button>
                  <button type="button" onClick={() => navigateTo('applications', '/careers')} className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition">
                    Explore careers
                  </button>
                </div>
              </div>
            </section>

            {/* Pre-order strip */}
            <section className="rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/5 px-6 py-8 sm:px-10 flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Pre-order interest</h2>
                <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">We are not processing payments yet. Register your interest and we will notify you when pre-orders open.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handlePreorder(null); }} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:min-w-[360px]">
                <input type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="Email address" className="flex-1 rounded-full bg-slate-950 border border-slate-700 px-5 py-3 text-sm text-white outline-none focus:border-cyan-500" />
                <button type="submit" disabled={waitlistSubmitting} className="rounded-full bg-white text-slate-950 font-semibold text-sm px-6 py-3 hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap">
                  {waitlistSubmitting ? 'Saving…' : 'Notify me'}
                </button>
              </form>
            </section>

            {/* Featured */}
            <section>
              <div className="flex items-end justify-between mb-6 sm:mb-8 px-1">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Featured</h2>
                  <p className="text-sm text-slate-400 mt-1">A closer look at the lineup.</p>
                </div>
                <button type="button" onClick={() => navigateTo('shop', '/shop')} className="text-sm font-medium text-cyan-400 hover:text-cyan-300">View all →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openProduct(p)}
                    className="group text-left rounded-[1.5rem] border border-white/5 bg-slate-900/80 overflow-hidden hover:border-white/15 transition-all"
                  >
                    <div className="aspect-[16/10] bg-slate-950 overflow-hidden">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{p.category}</p>
                      <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white tracking-tight">{p.name}</h3>
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2">{p.description}</p>
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
                <div key={x.t} className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
                  <h3 className="text-base font-semibold text-white">{x.t}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{x.d}</p>
                </div>
              ))}
            </section>
          </div>
        )}


        {activeTab === 'shop' && !selectedProduct && (
          <div className="space-y-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-8 sm:p-12 border border-slate-800 overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
                  <Zap className="w-3.5 h-3.5" /> Next-Gen Hardware Systems
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">Precision Engineering for High Performance</h1>
                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                  Discover workstation class compute systems, acoustically engineered chassis, reference displays, and ultra-low noise peripherals.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { const el = document.getElementById('catalog-grid'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm">Browse Catalog</button>
                  <button type="button" onClick={() => setAiDrawerOpen(true)} className="px-5 py-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-sm flex items-center gap-2"><Bot className="w-4 h-4" /> Configure Custom System</button>
                </div>
              </div>
            </div>

            
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Pre-order interest — get notified at launch</p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">Payments are not open yet. Join the pre-order list and we will email you when you can complete a purchase.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handlePreorder(null); }} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:min-w-[320px]">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold text-sm whitespace-nowrap"
                  >
                    {waitlistSubmitting ? 'Saving…' : 'Join pre-order list'}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap gap-2">
                {['All', 'Workstations', 'Desktops', 'Displays', 'Peripherals', 'Accessories', 'Audio'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog items, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div id="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="relative aspect-video overflow-hidden bg-slate-950 cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        if (product.options?.colors?.length) setSelectedColor(product.options.colors[0]);
                        navigateTo('shop', `/shop/${product.id}`);
                      }}
                    >
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-cyan-400 border border-slate-800">
                        {renderSafe(product.category)}
                      </span>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold text-white">{renderSafe(product.rating)}</span>
                        <span className="text-slate-500">({renderSafe(product.reviewsCount)} reviews)</span>
                      </div>
                      <h3
                        onClick={() => {
                          setSelectedProduct(product);
                          if (product.options?.colors?.length) setSelectedColor(product.options.colors[0]);
                          navigateTo('shop', `/shop/${product.id}`);
                        }}
                        className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors cursor-pointer line-clamp-1"
                      >
                        {renderSafe(product.name)}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{renderSafe(product.description)}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Unit Price</span>
                        <span className="text-xl font-black text-white">£{Number(product.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (product.options?.colors?.length) setSelectedColor(product.options.colors[0]);
                          addToCart(product);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              ← Back to Catalog
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 bg-slate-900/60 rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-10 shadow-2xl">
              <div className="aspect-square min-h-[280px] sm:min-h-[400px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">{renderSafe(selectedProduct.category)}</span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 mb-2">{renderSafe(selectedProduct.name)}</h1>
                  <div className="flex items-center gap-2 text-amber-400 text-sm mb-4">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-white">{renderSafe(selectedProduct.rating)}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">{renderSafe(selectedProduct.description)}</p>

                  {selectedProduct.specs && (
                    <ul className="mb-4 space-y-1">
                      {selectedProduct.specs.map((s, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  {selectedProduct.options?.colors && (
                    <div className="mb-4">
                      <span className="text-sm font-bold text-slate-300 block mb-3">Choose colour / finish</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.options.colors.map((col, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedColor(col)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                              selectedColor === col ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-cyan-500/50'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Total Price (GBP)</span>
                    <span className="text-3xl font-black text-white">£{Number(selectedProduct.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button type="button" onClick={() => addToCart(selectedProduct)} className="px-8 py-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                      <ShoppingCart className="w-5 h-5" /> Add to Basket
                    </button>
                    <button type="button" disabled={waitlistSubmitting} onClick={() => { if (user?.email) setWaitlistEmail(user.email); handlePreorder(selectedProduct); }} className="px-8 py-3.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm cursor-pointer">
                      Pre-order interest
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews — only after Delivered */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Verified Buyer Reviews</h3>
              {hasUserReceivedProduct(selectedProduct.id) ? (
                <form onSubmit={submitReview} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase">Write a Verified Review</h4>
                  <select value={newReviewRating} onChange={(e) => setNewReviewRating(Number(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  <textarea rows="3" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} placeholder="Share your experience..." className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white" />
                  <button type="submit" className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer">
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Only verified buyers whose order status is <strong className="text-emerald-400">Delivered</strong> can submit reviews.</span>
                </div>
              )}

              <div className="space-y-4 pt-2">
                {!reviews[selectedProduct.id] || reviews[selectedProduct.id].length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No reviews submitted yet.</p>
                ) : (
                  reviews[selectedProduct.id].map((rev) => (
                    <div key={rev.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{rev.userName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">✓ Verified Buyer</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-300">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* CART */}
        {activeTab === 'cart' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-extrabold text-white mb-2">Shopping Basket</h1>
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
                <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300">Your basket is empty</h3>
                <button onClick={() => setActiveTab('shop')} className="mt-4 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm cursor-pointer">
                  Return to Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-900/60 rounded-3xl border border-slate-800 divide-y divide-slate-800 overflow-hidden shadow-2xl">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedColor}`} className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-slate-950 border border-slate-800 flex-shrink-0" />
                        <div>
                          <h3 className="text-base font-bold text-white">{renderSafe(item.name)}</h3>
                          <span className="text-xs font-mono text-cyan-300 block">{item.selectedColor}</span>
                          <span className="text-sm font-semibold text-cyan-400">£{Number(item.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                          <button onClick={() => updateCartQty(item.id, item.selectedColor, -1)} className="text-slate-400 hover:text-white cursor-pointer">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center">{renderSafe(item.qty)}</span>
                          <button onClick={() => updateCartQty(item.id, item.selectedColor, 1)} className="text-slate-400 hover:text-white cursor-pointer">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.selectedColor)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 space-y-6 shadow-2xl">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="PROMO CODE" value={appliedCode} onChange={(e) => setAppliedCode(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs uppercase text-white flex-1 outline-none" />
                      <button onClick={handleApplyDiscount} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl font-bold cursor-pointer">
                        Apply
                      </button>
                    </div>
                    {discountError && <p className="text-[11px] text-rose-400">{discountError}</p>}
                    {appliedDiscount && <p className="text-[11px] text-emerald-400 font-bold">✓ Applied {appliedDiscount.code}!</p>}
                  </div>
                  <div className="space-y-3 text-sm pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount</span>
                        <span>-£{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-800 flex justify-between text-lg font-black text-white">
                      <span>Total</span>
                      <span>£{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={handleInitiateCheckout} className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-base transition-all flex items-center justify-center gap-2 cursor-pointer">
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
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No order history found</h3>
                <button onClick={() => setActiveTab('shop')} className="mt-4 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm cursor-pointer">
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white font-mono">{renderSafe(order.id)}</span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : order.status === 'Shipped'
                                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                                  : order.status === 'Canceled'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {renderSafe(order.status || 'Processing')}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-1 block">
                          Placed on {renderSafe(order.date)} via {renderSafe(order.paymentMethod)}
                        </span>
                        {order.shippingAddress && <span className="text-xs text-slate-400 mt-1 block">Ship to: {order.shippingAddress}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Total</span>
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
                              <span className="text-cyan-300 ml-2">{item.selectedColor}</span>
                              <span className="text-slate-400 ml-2">
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

        <footer className="mt-16 border-t border-slate-800 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} Zortius. Built for what comes next.</span>
            <nav className="flex flex-wrap justify-center gap-4">
              <button onClick={() => navigateTo('home', '/')} className="hover:text-cyan-300">
                Home
              </button>
              <button onClick={() => navigateTo('shop', '/shop')} className="hover:text-cyan-300">
                Shop
              </button>
              <button onClick={() => navigateTo('applications', '/careers')} className="hover:text-cyan-300">
                Applications
              </button>
              <button onClick={() => navigateTo('about', '/about')} className="hover:text-cyan-300">
                About
              </button>
              <button onClick={() => navigateTo('contact', '/contact')} className="hover:text-cyan-300">
                Contact
              </button>
              <button onClick={() => navigateTo('faq', '/faq')} className="hover:text-cyan-300">
                FAQ
              </button>
              <button onClick={() => navigateTo('privacy', '/privacy')} className="hover:text-cyan-300">
                Privacy
              </button>
              <button onClick={() => navigateTo('terms', '/terms')} className="hover:text-cyan-300">
                Terms
              </button>
            </nav>
          </div>
        </footer>
      </main>

      {/* CHECKOUT MODAL — proper address + Stripe */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
            <button onClick={() => setCheckoutModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white">
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
            <p className="text-xs text-slate-400">
              Basket total: <strong className="text-white">£{grandTotal.toFixed(2)}</strong>
            </p>
            <button type="button" onClick={() => setCheckoutModalOpen(false)} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">
              Back to basket
            </button>
          </div>
        </div>
      )}

            {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setProfileModalOpen(false);
                setAuthError('');
                setEmail('');
                setPassword('');
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Your Account</h3>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Display Name</label>
                  <div className="flex gap-2">
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                    <button
                      onClick={async () => {
                        await saveUserDataToFirestore(cart, orders, userName);
                        showNotification('Display name updated');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
                {isAdmin && (
                  <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3 text-xs text-cyan-300">
                    You are logged in as <strong>{isFullAdmin ? 'Full Admin' : 'Limited Admin'}</strong>
                  </div>
                )}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => { setProfileModalOpen(false); navigateTo('orders', '/account/orders'); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 hover:border-cyan-500/40 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2"><Package className="w-4 h-4 text-cyan-400" /> Order history</span>
                    <span className="text-xs text-slate-500">{orders.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileModalOpen(false); setContactModalOpen(true); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 hover:border-cyan-500/40 flex items-center gap-2"
                  >
                    <Headphones className="w-4 h-4 text-cyan-400" /> Contact support
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { setProfileModalOpen(false); navigateTo('admin', '/admin'); }}
                      className="w-full text-left px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-300 font-bold"
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
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h3>
                  <p className="text-xs text-slate-400 mt-1">{authMode === 'login' ? 'Sign in to continue' : 'Join Zortius'}</p>
                </div>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
                    Login
                  </button>
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authMode === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
                    Sign Up
                  </button>
                </div>
                <form onSubmit={authMode === 'login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    Remember me
                  </label>
                  {authError && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{authError}</div>}
                  <button type="submit" disabled={authSubmitting} className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {authSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
                <button onClick={handleGoogleSignIn} disabled={authSubmitting} className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2">
                  Continue with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
