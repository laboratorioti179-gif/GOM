import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  PackageSearch, 
  CheckCircle2, 
  Settings, 
  X, 
  Search,
  ChevronRight,
  ChevronLeft,
  Bell, 
  Home, 
  ClipboardList, 
  Box, 
  Store, 
  Menu, 
  DollarSign, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  LogOut,
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Eye,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Receipt
} from 'lucide-react';

const SUPABASE_URL = 'https://jwhpbtuavifcfywsrrfx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aHBidHVhdmlmY2Z5d3NycmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzczMzEsImV4cCI6MjA4NDc1MzMzMX0.qeUZ_X1mqo9iytDhUJimx72XA9nQoaWsFXx-vUTM6qc';

// --- MOCK DATA PARA AGENDA ---
const AGENDA_TODAY = [
  { time: "10:00", title: "Troca de Óleo - Pedro M." },
  { time: "14:30", title: "Diagnostico Elétrico - Ana S." }
];

const POPULAR_BIKES = [
  "Honda CG 160 Titan", "Honda CG 150 Titan", "Honda CB 300R", "Honda CB 600F Hornet",
  "Honda XRE 300", "Honda PCX 160", "Honda NXR 160 Bros", "Honda Biz 125",
  "Yamaha YBR 125", "Yamaha Fazer 250", "Yamaha MT-03", "Yamaha MT-07", "Yamaha MT-09", 
  "Yamaha XJ6", "Yamaha NMAX 160", "Yamaha Crosser 150", "Yamaha Lander 250",
  "Kawasaki Ninja 400", "Kawasaki Z400", "Kawasaki Z900", "BMW R 1250 GS", 
  "BMW G 310 R", "BMW F 850 GS", "Suzuki Yes 125", "Suzuki GSX-S750", 
  "Suzuki V-Strom 650", "Triumph Tiger 900"
];

// Gerador de UUID v4 robusto (RFC4122)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getBikeImage = (bikeName) => {
  if (!bikeName) return "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=400&h=200";
  const query = encodeURIComponent(bikeName + " motocicleta lateral");
  return `https://tse2.mm.bing.net/th?q=${query}&w=600&h=300&c=7&rs=1`; 
};

// Helper para validar UUID
const isValidUUID = (uuid) => {
  const s = "" + uuid;
  const match = s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  return !!match;
};

// Helper para garantir que o ID seja um UUID válido para o banco de dados
const getSafeUserId = (id) => {
  if (!id) return null;
  if (isValidUUID(id)) return id;
  const hex = String(id).replace(/[^0-9a-f]/g, '').padStart(12, '0').slice(-12);
  return `00000000-0000-4000-a000-${hex}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [homeFilter, setHomeFilter] = useState('todas');
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [supabase, setSupabase] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auth states
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Sign Up Extra fields
  const [suWorkshopName, setSuWorkshopName] = useState('');
  const [suTaxId, setSuTaxId] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suAddress, setSuAddress] = useState('');
  const [suPersonalName, setSuPersonalName] = useState('');

  // Profile states
  const [profileName, setProfileName] = useState('GOM');
  const [profilePhone, setProfilePhone] = useState('(11) 98765-4321');
  const [profileAddress, setProfileAddress] = useState('Av. Principal, 1000');
  const [profileLogo, setProfileLogo] = useState('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Finance states
  const [transactions, setTransactions] = useState([]);
  const [financeSubTab, setFinanceSubTab] = useState('fluxo'); // fluxo, receber, pagar
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [finType, setFinType] = useState('entrada'); // entrada, saida
  const [finOsId, setFinOsId] = useState('');
  const [finCategory, setFinCategory] = useState('Mão de obra');
  const [finStatus, setFinStatus] = useState('Pago'); // Pago, Pendente, Parcial
  const [finMethod, setFinMethod] = useState('PIX'); // PIX, Dinheiro, Cartão
  const [finValue, setFinValue] = useState('');
  const [finDate, setFinDate] = useState('');
  const [finDesc, setFinDesc] = useState('');

  // Agenda states
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Notificações state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarBlanks = Array.from({ length: startDay }, (_, i) => i);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    // Configurações para Atalho (PWA/Mobile)
    document.title = "GOM";
    
    // Criação do ícone em PNG a partir de SVG para compatibilidade com iOS/Safari
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512"><rect width="100" height="100" rx="22" fill="#e62020"/><g transform="scale(3) translate(4.66, 4.66)" fill="white"><path d="M19 14.5c-1.3 0-2.43.83-2.82 2H15v-1c0-1.1-.9-2-2-2H9v-1h3c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H8.5L7.15 2.3c-.22-.64-.85-1.05-1.54-1.05H2v2h3.61l1.35 4H4v2h4.51l.8 2.39c-.44.42-.71 1.01-.71 1.66 0 .58.21 1.11.56 1.52l-2.07 3.55C5.46 16.18 4.76 16 4 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.46-.08-.9-.23-1.3l2.25-3.86.32.22c.98.66 2.15 1.03 3.39 1.03 1.13 0 2.21-.32 3.16-.88L18.42 21h2.16l-3.36-5.83c.53-.49.88-1.2.88-1.99 0-1.46-1.18-2.65-2.64-2.65zM4 22c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm9.3-5.59c-.46-.31-1-.49-1.57-.49s-1.11.18-1.57.49l-.65-.43L9.67 15h3.11l.17.98-.65.43zM19 18c-.83 0-1.5-.67-1.5-1.5S18.17 15 19 15s1.5.67 1.5 1.5S19.83 18 19 18z"/></g></svg>`;
    
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      
      const head = document.getElementsByTagName('head')[0];
      
      // Remover tags antigas se existirem para não duplicar
      document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']").forEach(e => e.remove());
      
      // Favicon e Atalho Desktop
      const linkIcon = document.createElement('link');
      linkIcon.type = 'image/png';
      linkIcon.rel = 'shortcut icon';
      linkIcon.href = pngUrl;
      head.appendChild(linkIcon);

      // Ícone para iPhone (Home Screen) - iOS precisa obrigatoriamente de PNG
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = pngUrl;
      head.appendChild(appleIcon);
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgString);

    const head = document.getElementsByTagName('head')[0];

    // Nome no atalho mobile
    const metaMobile = document.querySelector("meta[name='apple-mobile-web-app-title']") || document.createElement('meta');
    metaMobile.name = "apple-mobile-web-app-title";
    metaMobile.content = "GOM";
    if (!metaMobile.parentNode) head.appendChild(metaMobile);

    // Modo App no mobile
    const metaCapable = document.querySelector("meta[name='apple-mobile-web-app-capable']") || document.createElement('meta');
    metaCapable.name = "apple-mobile-web-app-capable";
    metaCapable.content = "yes";
    if (!metaCapable.parentNode) head.appendChild(metaCapable);

    const loadSupabase = () => {
      if (window.supabase) {
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(sb);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://unpkg.com/@supabase/supabase-js@2";
      script.onload = () => {
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(sb);
      };
      document.head.appendChild(script);
    };
    loadSupabase();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    
    const fetchServices = async () => {
      const safeId = getSafeUserId(session.user.id);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', safeId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setServices(data);
      } else if (error) {
        console.error("Erro ao buscar serviços:", error.message);
        if (error.code === "42501") {
          setAuthError("Erro de Permissão: Ative a política RLS para 'SELECT' na tabela 'services' no painel do Supabase.");
        }
      }
    };
    fetchServices();

    const fetchProfile = async () => {
      const safeId = getSafeUserId(session.user.id);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', safeId).single();
      if (data) {
        setProfileName(data.name || 'GOM');
        setProfilePhone(data.phone || '(11) 98765-4321');
        setProfileAddress(data.address || 'Av. Principal, 1000');
        if (data.logo_url) setProfileLogo(data.logo_url);
      }
    };
    fetchProfile();
  }, [supabase, session]);

  const [newClient, setNewClient] = useState('');
  const [newBike, setNewBike] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newTech, setNewTech] = useState('');

  const totalIncome = services.reduce((acc, curr) => curr.cost ? acc + curr.cost : acc, 0);
  const totalOSCount = services.length;
  const scheduledCount = services.filter(s => s.status === 'Agendado').length;
  const productionCount = services.filter(s => !['Agendado', 'Finalizado', 'Entregue'].includes(s.status)).length; 

  const delayedServices = services.filter(s => {
    if (['Finalizado', 'Entregue'].includes(s.status)) return false;
    if (!s.deadline_raw) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(s.deadline_raw);
    return deadlineDate < today;
  });
  const delayedCount = delayedServices.length;

  // Calculos Financeiros
  const financeIncome = transactions.filter(t => t.type === 'entrada' && t.status !== 'Pendente').reduce((acc, t) => acc + t.value, 0);
  const financeExpense = transactions.filter(t => t.type === 'saida' && t.status !== 'Pendente').reduce((acc, t) => acc + t.value, 0);
  const financeProfit = financeIncome - financeExpense;
  const ticketMedio = services.length > 0 ? (services.reduce((acc, s) => acc + (s.cost || 0), 0) / services.length) : 0;
  
  const contasAReceber = services.map(os => {
    const paidAmount = transactions.filter(t => t.type === 'entrada' && t.osId === os.id && t.status !== 'Pendente').reduce((acc, t) => acc + t.value, 0);
    return { ...os, paidAmount, pendingAmount: (os.cost || 0) - paidAmount };
  }).filter(os => os.pendingAmount > 0 && os.cost > 0);

  const contasAPagar = transactions.filter(t => t.type === 'saida' && t.status === 'Pendente');

  const handleCreateFinance = (e) => {
    e.preventDefault();
    const newTrans = {
      id: generateUUID(),
      type: finType,
      osId: finType === 'entrada' ? finOsId : null,
      category: finCategory,
      status: finStatus,
      method: finStatus !== 'Pendente' ? finMethod : null,
      value: parseFloat(finValue),
      date: finDate,
      desc: finType === 'saida' ? finDesc : (services.find(s => s.id === finOsId)?.bike || 'Receita Diversa'),
      created_at: new Date().toISOString()
    };
    setTransactions([newTrans, ...transactions]);
    setIsFinanceModalOpen(false);
    setFinValue(''); setFinDate(''); setFinDesc(''); setFinOsId('');
  };

  const handleCreateOS = async (e) => {
    e.preventDefault();
    
    const newId = generateUUID(); 
    const safeUserId = getSafeUserId(session.user.id);
    
    let formattedDeadline = "A definir";
    if (newDeadline) {
      const [year, month, day] = newDeadline.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      formattedDeadline = `${day} ${months[parseInt(month, 10) - 1]}`;
    }

    const newOS = {
      id: newId,
      user_id: safeUserId,
      client: newClient,
      bike: newBike.toUpperCase(),
      plate: newPlate.toUpperCase(),
      status: "Agendado",
      issue: newIssue,
      deadline: formattedDeadline,
      deadline_raw: newDeadline,
      cost: newCost ? parseFloat(newCost) : 0,
      tech: newTech || "Não atribuído",
      image: getBikeImage(newBike),
      created_at: new Date().toISOString()
    };
    
    setServices([newOS, ...services]);
    setIsModalOpen(false); 

    if (supabase) {
      const { error } = await supabase.from('services').insert([newOS]);
      if (error) {
        console.error("Erro ao salvar no Supabase:", error);
        if (error.code === "42501") {
          setAuthError("Bloqueio de Segurança: Você precisa criar uma política RLS no Supabase permitindo 'INSERT' para usuários anônimos na tabela 'services'.");
          setServices(prev => prev.filter(s => s.id !== newId));
          setActiveTab('perfil'); 
        } else if (error.code === "23503") {
          setAuthError("Erro de Vínculo (23503): O banco de dados está tentando vincular a O.S. a um usuário inexistente na tabela 'users'. Execute: ALTER TABLE services DROP CONSTRAINT services_user_id_fkey; no Editor SQL do Supabase.");
          setServices(prev => prev.filter(s => s.id !== newId));
        }
      }
    }
    
    setNewClient(''); setNewBike(''); setNewPlate(''); setNewIssue(''); setNewDeadline(''); setNewCost(''); setNewTech('');
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const updatedServices = services.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setServices(updatedServices);
    if (selectedService && selectedService.id === id) {
      setSelectedService({ ...selectedService, status: newStatus });
    }

    // Sincronizar OS encerrada com o financeiro
    if (newStatus === 'Finalizado' || newStatus === 'Entregue') {
      const os = services.find(s => s.id === id);
      if (os && os.cost > 0) {
        setTransactions(prevTransactions => {
          const paidAmount = prevTransactions.filter(t => t.type === 'entrada' && t.osId === id && t.status !== 'Pendente').reduce((acc, t) => acc + t.value, 0);
          const pendingAmount = os.cost - paidAmount;
          
          if (pendingAmount > 0) {
            const newTrans = {
              id: generateUUID(),
              type: 'entrada',
              osId: id,
              category: 'Mão de obra',
              status: 'Pago',
              method: 'PIX',
              value: pendingAmount,
              date: new Date().toISOString().split('T')[0],
              desc: `OS Encerrada - ${os.bike}`,
              created_at: new Date().toISOString()
            };
            return [newTrans, ...prevTransactions];
          }
          return prevTransactions;
        });
      }
    }

    if (supabase) {
      const { error } = await supabase.from('services').update({ status: newStatus }).eq('id', id);
      if (error) {
        if (error.code === "42501") {
          setAuthError("Erro de Permissão: Ative a política RLS para 'UPDATE' no painel do Supabase.");
        } else if (error.code === "23503") {
          setAuthError("Erro de Vínculo: Remova a restrição de chave estrangeira (FK) da coluna user_id na tabela services.");
        }
      }
    }
  };

  const handleDeleteOS = async (id) => {
    setServices(services.filter(s => s.id !== id));
    if (supabase) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error && error.code === "42501") {
        setAuthError("Erro de Permissão: Ative a política RLS para 'DELETE' no painel do Supabase.");
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const safeId = getSafeUserId(session.user.id);
    if (supabase && session) {
      const { error } = await supabase.from('profiles').upsert([{
        id: safeId,
        name: profileName,
        phone: profilePhone,
        address: profileAddress,
        logo_url: profileLogo
      }]);
      if (error && error.code === "42501") {
        setAuthError("Erro de RLS: Crie uma política no Supabase permitindo 'ALL' ou 'INSERT/UPDATE' na tabela 'profiles'.");
      }
    }
    setTimeout(() => setIsSavingProfile(false), 2000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    if (supabase) {
      if (isSignUp) {
        const newUserId = generateUUID(); 
        const { data, error } = await supabase
          .from('profiles')
          .insert([{ 
            id: newUserId, 
            email: authEmail, 
            password: authPassword, 
            name: suWorkshopName,
            tax_id: suTaxId,
            phone: suPhone,
            address: suAddress,
            responsible_name: suPersonalName
          }])
          .select();
        if (error) {
          if (error.code === "42501") {
            setAuthError('Erro RLS: A tabela profiles não permite inserções. Verifique as Políticas RLS no Supabase.');
          } else {
            setAuthError('Erro ao cadastrar: ' + error.message);
          }
        } else {
          setAuthError('Cadastro realizado com sucesso! Faça login.');
          setIsSignUp(false);
          setAuthEmail('');
          setAuthPassword('');
        }
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authEmail)
          .eq('password', authPassword)
          .single();
        if (error || !data) {
          setAuthError('E-mail ou senha incorretos.');
        } else {
          setSession({ user: data });
        }
      }
    }
    setIsAuthLoading(false);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Agendado': case 'Recebido': return { badge: 'bg-[#64748b] text-white', border: 'border-l-[#64748b]' };
      case 'Em diagnóstico': case 'Aguardando aprovação': case 'Aguardando peças': case 'Aguardando retirada': return { badge: 'bg-[#ffc107] text-black', border: 'border-l-[#ffc107]' };
      case 'Orçamento enviado': case 'Aprovado': case 'Em andamento': case 'Revisão/Teste': return { badge: 'bg-[#3b82f6] text-white', border: 'border-l-[#3b82f6]' };
      case 'Finalizado': case 'Entregue': return { badge: 'bg-[#10b981] text-white', border: 'border-l-[#10b981]' };
      default: return { badge: 'bg-[#64748b] text-white', border: 'border-l-[#64748b]' };
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center bg-[#0a0a0a] h-screen w-full font-inter overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#0a0a0a] to-zinc-900"></div>
        <div className="absolute -top-[10%] -left-[20%] w-[80%] h-[60%] bg-[#e62020]/10 blur-[120px] rounded-full rotate-45"></div>
        <div className="absolute -bottom-[10%] -right-[20%] w-[80%] h-[60%] bg-[#e62020]/10 blur-[120px] rounded-full -rotate-45"></div>
        
        <div className="w-full sm:max-w-[380px] h-full flex flex-col items-center justify-center relative z-10 px-6">
          <div className="text-center mb-8 anim-fade flex flex-col items-center">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[#e62020] rounded-lg shadow-[0_0_15px_rgba(230,32,32,0.4)]">
                   <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 14.5c-1.3 0-2.43.83-2.82 2H15v-1c0-1.1-.9-2-2-2H9v-1h3c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H8.5L7.15 2.3c-.22-.64-.85-1.05-1.54-1.05H2v2h3.61l1.35 4H4v2h4.51l.8 2.39c-.44.42-.71 1.01-.71 1.66 0 .58.21 1.11.56 1.52l-2.07 3.55C5.46 16.18 4.76 16 4 16c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.46-.08-.9-.23-1.3l2.25-3.86.32.22c.98.66 2.15 1.03 3.39 1.03 1.13 0 2.21-.32 3.16-.88L18.42 21h2.16l-3.36-5.83c.53-.49.88-1.2.88-1.99 0-1.46-1.18-2.65-2.64-2.65zM4 22c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm9.3-5.59c-.46-.31-1-.49-1.57-.49s-1.11.18-1.57.49l-.65-.43L9.67 15h3.11l.17.98-.65.43zM19 18c-.83 0-1.5-.67-1.5-1.5S18.17 15 19 15s1.5.67 1.5 1.5S19.83 18 19 18z"/></svg>
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase font-poppins italic">
                  G<span className="not-italic">OM</span>
                </h1>
             </div>
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Gestão Administrativa</p>
          </div>

          <div className="w-full bg-[#161616] rounded-[32px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-zinc-800/50 anim-slide-up">
            <form onSubmit={handleLogin} className="w-full space-y-4">
              {isSignUp && (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input required type="text" value={suWorkshopName} onChange={(e) => setSuWorkshopName(e.target.value)} className="w-full bg-white text-black rounded-full pl-11 pr-4 h-11 text-xs font-medium focus:outline-none" placeholder="Nome da Oficina" />
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input required type="text" value={suTaxId} onChange={(e) => setSuTaxId(e.target.value)} className="w-full bg-white text-black rounded-full pl-11 pr-4 h-11 text-xs font-medium focus:outline-none" placeholder="CNPJ / CPF" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input required type="text" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} className="w-full bg-white text-black rounded-full pl-11 pr-4 h-11 text-xs font-medium focus:outline-none" placeholder="Telefone" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input required type="text" value={suAddress} onChange={(e) => setSuAddress(e.target.value)} className="w-full bg-white text-black rounded-full pl-11 pr-4 h-11 text-xs font-medium focus:outline-none" placeholder="Endereço" />
                  </div>
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-white text-black rounded-full pl-11 pr-4 h-11 text-xs font-medium focus:outline-none" placeholder="E-mail" />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input required type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-white text-black rounded-full pl-11 pr-4 h-11 text-xs font-medium focus:outline-none" placeholder="Senha" />
              </div>

              <div className="flex justify-end pr-2">
                 <button type="button" className="text-zinc-400 text-[10px] font-semibold hover:text-white transition-colors">Esqueceu a senha?</button>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl text-red-500 text-[10px] font-bold text-center">
                  {authError}
                </div>
              )}

              <button disabled={isAuthLoading} type="submit" className="w-full h-11 bg-[#e62020] hover:bg-[#ff2b2b] text-white rounded-full text-sm font-black transition-all shadow-[0_8px_20px_rgba(230,32,32,0.3)] font-poppins uppercase tracking-widest mt-2 active:scale-95">
                {isAuthLoading ? 'Aguarde...' : 'ENTRAR'}
              </button>

              <div className="text-center pt-3">
                <p className="text-gray-400 text-[10px] font-semibold">
                   {isSignUp ? 'Já possui uma conta?' : 'Não tem uma conta?'}
                </p>
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }} className="text-white text-[11px] font-black uppercase tracking-wider mt-1 hover:text-[#e62020] transition-colors">
                  {isSignUp ? 'Login' : 'Cadastre-se'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-black h-screen w-full font-inter overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90"></div>
      
      <div className="w-full h-full flex flex-row relative z-10 max-w-[1440px] mx-auto overflow-hidden">
        {/* Sidebar fixa para Desktop */}
        <aside className="hidden lg:flex w-64 bg-[#16181d]/95 backdrop-blur-md border-r border-zinc-800 flex-col shrink-0 shadow-2xl">
          <div className="px-5 py-8 border-b border-zinc-800/50 bg-[#1a1c23]/30">
            <h1 className="text-xl font-black tracking-tight text-white uppercase font-poppins italic">
              G<span className="text-[#e62020] not-italic">OM</span>
            </h1>
            <p className="text-gray-500 text-[8px] uppercase tracking-[0.2em] mt-1 font-bold">Oficina de Alta Performance</p>
          </div>
          <div className="flex flex-col py-6 gap-2.5 px-3 flex-1 overflow-y-auto custom-scrollbar">
            <SideMenuItem icon={<Home />} label="Início" isActive={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
            <SideMenuItem icon={<Calendar />} label="Agenda" isActive={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
            <SideMenuItem icon={<ClipboardList />} label="Ordens de Serviço" isActive={activeTab === 'ordens'} onClick={() => setActiveTab('ordens')} />
            <SideMenuItem icon={<Wallet />} label="Financeiro" isActive={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} />
            <SideMenuItem icon={<Store />} label="Configurações da Loja" isActive={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} />
          </div>
          <div className="p-5 border-t border-zinc-800 bg-black/20">
            <button onClick={() => setSession(null)} className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">
              <LogOut className="w-3.5 h-3.5 text-[#e62020]" /> Sair
            </button>
          </div>
        </aside>

        {/* Container Principal que se adapta */}
        <div className="flex-1 flex flex-col bg-[#0f1115]/90 backdrop-blur-sm relative overflow-hidden lg:border-l border-zinc-800 w-full sm:max-w-[480px] lg:max-w-none mx-auto lg:mx-0 shadow-2xl">
          <header className="pt-6 pb-3 px-4 shrink-0 z-10 flex justify-between items-center bg-[#0f1115]/50 border-b border-zinc-800/30">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setIsMenuOpen(true)} className="lg:hidden text-white hover:text-[#e62020] transition-colors active:scale-95">
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="hidden lg:block text-white font-black uppercase text-xs tracking-widest font-poppins opacity-80">Painel Operacional</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right flex items-center gap-2.5">
                <p className="hidden sm:block text-gray-300 text-xs font-medium">Oficina: <strong className="text-white">{profileName}</strong></p>
                <div className="relative">
                  <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative flex items-center justify-center focus:outline-none">
                    <Bell className="w-4 h-4 text-gray-300 hover:text-white transition-colors" />
                    {delayedCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#e62020] text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-[#0f1115] animate-pulse">
                        {delayedCount}
                      </span>
                    )}
                  </button>
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#16181d] border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden anim-fade text-left">
                      <div className="px-4 py-3 border-b border-zinc-800 bg-[#1a1c23]">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Notificações</h3>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {delayedServices.length > 0 ? (
                          delayedServices.map(s => (
                            <div key={s.id} onClick={() => { setSelectedService(s); setIsNotificationsOpen(false); }} className="px-4 py-3 hover:bg-zinc-800/50 cursor-pointer border-b border-zinc-800/50 last:border-0 transition-colors">
                              <p className="text-[9px] text-[#e62020] font-black uppercase tracking-widest mb-1">O.S. Atrasada</p>
                              <p className="text-xs text-white font-bold truncate">{s.bike}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{s.client}</p>
                              <p className="text-[9px] text-gray-500 mt-1.5 italic">Previsão: {s.deadline}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-[10px] text-gray-500 italic">
                            Sem notificações no momento.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <img src={profileLogo} alt="Profile" className="w-8 h-8 rounded-full border border-zinc-700 object-cover shadow-lg" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar lg:px-6">
            {authError && (
              <div className="mx-4 mt-3 p-3 bg-red-900/20 border border-red-900/40 rounded-xl text-red-500 text-[10px] font-bold anim-slide-up">
                ⚠️ {authError}
                <button onClick={() => setAuthError('')} className="float-right text-white font-black uppercase ml-4">entendido</button>
              </div>
            )}

            {activeTab === 'inicio' && (
              <div className="anim-slide-up lg:py-6">
                <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5 mt-3">
                  <StatBox 
                    icon={<ClipboardList className="w-4 h-4" />} 
                    title="Todas" 
                    value={totalOSCount} 
                    isActive={homeFilter === 'todas'}
                    onClick={() => setHomeFilter('todas')}
                  />
                  <StatBox 
                    icon={<Calendar className="w-4 h-4" />} 
                    title="Agendados" 
                    value={scheduledCount} 
                    isActive={homeFilter === 'agendados'}
                    onClick={() => setHomeFilter('agendados')}
                  />
                  <StatBox 
                    icon={<Wrench className="w-4 h-4" />} 
                    title="Em produção" 
                    value={productionCount} 
                    isActive={homeFilter === 'producao'}
                    onClick={() => setHomeFilter('producao')}
                  />
                  <StatBox icon={<DollarSign className="w-4 h-4" />} title="Hoje" value={`R$ ${totalIncome}`} />
                </div>
                <hr className="border-[#e62020] border-t-[1.5px] opacity-80 mx-4 lg:mx-0" />
                <div className="p-4 lg:px-0 lg:mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] sm:text-base font-black text-white uppercase tracking-wide font-poppins">Filtro: {homeFilter === 'todas' ? 'Todas' : homeFilter === 'agendados' ? 'Agendadas' : 'Em Produção'}</h2>
                    <button onClick={() => setActiveTab('ordens')} className="text-[9px] sm:text-xs text-gray-400 font-medium flex items-center hover:text-white transition-colors uppercase tracking-widest">
                      Gerenciar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      const filtered = services.filter(s => {
                        if (homeFilter === 'agendados') return s.status === 'Agendado';
                        if (homeFilter === 'producao') return !['Agendado', 'Finalizado', 'Entregue'].includes(s.status);
                        return true;
                      });
                      
                      return filtered.length > 0 ? (
                        filtered.slice(0, 8).map((service) => (
                          <ServiceCard key={service.id} service={service} getStatusStyle={getStatusStyle} onOpenDetails={setSelectedService} />
                        ))
                      ) : (
                        <div className="md:col-span-2 bg-[#1c1e26] border border-dashed border-zinc-800 rounded-lg p-8 text-center text-gray-500 text-xs">
                          Nenhuma ordem de serviço encontrada.
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <hr className="border-[#e62020] border-t-[1.5px] opacity-80 mx-4 lg:mx-0 mt-6" />
                <div className="p-4 lg:px-0">
                  <h2 className="text-base font-black text-white uppercase tracking-wide font-poppins mb-3">Agenda</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 mb-5 bg-black/20 p-4 rounded-xl border border-zinc-800/50">
                    {services.filter(s => s.status === 'Agendado').length > 0 ? (
                      services.filter(s => s.status === 'Agendado').slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-gray-300 font-medium pb-2.5 border-b border-zinc-800/50 last:border-0 md:last:border-b">
                          <span className="text-white font-bold w-14 text-[#e62020] text-xs uppercase truncate">{item.deadline}</span>
                          <span className="text-[11px] truncate">{item.bike} - {item.client}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-gray-500 text-[10px] italic py-1.5">Não há agendamentos reais registrados.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ordens' && (
              <div className="p-5 anim-slide-up lg:py-8 lg:px-0">
                <h2 className="text-lg font-black text-white uppercase tracking-wide font-poppins mb-5">Controle</h2>
                <div className="relative mb-6 max-w-xl">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Buscar cliente, moto ou placa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-3.5 bg-[#1a1c23] border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#e62020] transition-all shadow-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.filter(s => s.bike.toLowerCase().includes(searchTerm.toLowerCase()) || s.client.toLowerCase().includes(searchTerm.toLowerCase())).map((service) => (
                    <ServiceCard key={service.id} service={service} getStatusStyle={getStatusStyle} onOpenDetails={setSelectedService} onDelete={handleDeleteOS} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="p-5 anim-slide-up lg:py-8 lg:px-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black text-white uppercase tracking-wide font-poppins">Agenda</h2>
                  <div className="flex items-center gap-4">
                    <button onClick={prevMonth} className="text-gray-400 hover:text-[#e62020] transition-colors p-1"><ChevronLeft className="w-5 h-5"/></button>
                    <span className="text-white font-black uppercase text-sm tracking-widest min-w-[140px] text-center">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                    <button onClick={nextMonth} className="text-gray-400 hover:text-[#e62020] transition-colors p-1"><ChevronRight className="w-5 h-5"/></button>
                  </div>
                </div>
                <div className="bg-[#1c1e26]/50 border border-zinc-800/50 rounded-xl p-4 shadow-xl">
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="text-gray-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarBlanks.map(b => <div key={`blank-${b}`} className="min-h-[70px] sm:min-h-[100px] p-2 bg-[#0f1115]/30 rounded-lg border border-zinc-800/20"></div>)}
                    {calendarDays.map(day => {
                      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayServices = services.filter(s => s.deadline_raw === dateStr);
                      const isToday = todayStr === dateStr;

                      return (
                        <div key={day} className={`min-h-[70px] sm:min-h-[100px] p-1.5 sm:p-2 rounded-lg border transition-colors ${isToday ? 'border-[#e62020] bg-[#e62020]/10 shadow-[inset_0_0_15px_rgba(230,32,32,0.1)]' : 'border-zinc-800/80 bg-[#0f1115] hover:border-zinc-600'} flex flex-col`}>
                          <span className={`text-[9px] sm:text-[11px] font-black ${isToday ? 'text-[#e62020]' : 'text-gray-400'} mb-1.5 block`}>{day}</span>
                          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
                            {dayServices.map(s => (
                              <div key={s.id} onClick={() => setSelectedService(s)} className="cursor-pointer bg-[#1a1c23] hover:bg-zinc-800 p-1.5 rounded-md text-[8px] sm:text-[9px] font-medium text-gray-300 truncate border-l-2 border-[#e62020] shadow-sm transition-colors" title={`${s.bike} - ${s.client}`}>
                                {s.bike}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financeiro' && (
              <div className="p-5 anim-slide-up lg:py-8 lg:px-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black text-white uppercase tracking-wide font-poppins">Financeiro</h2>
                  <button onClick={() => setIsFinanceModalOpen(true)} className="bg-[#e62020] text-white text-[9px] sm:text-xs font-black uppercase px-4 py-2 rounded-lg shadow-lg hover:bg-[#ff2b2b] transition-all">Nova Movimentação</button>
                </div>
                
                {/* 6. Resumo Financeiro */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <StatBox icon={<ArrowUpRight className="w-4 h-4" />} title="Faturamento" value={`R$ ${financeIncome.toFixed(2)}`} />
                  <StatBox icon={<ArrowDownRight className="w-4 h-4" />} title="Despesas" value={`R$ ${financeExpense.toFixed(2)}`} />
                  <StatBox icon={<DollarSign className="w-4 h-4" />} title="Lucro Líquido" value={`R$ ${financeProfit.toFixed(2)}`} />
                  <StatBox icon={<Activity className="w-4 h-4" />} title="Ticket Médio" value={`R$ ${ticketMedio.toFixed(2)}`} />
                </div>

                {/* Abas Internas */}
                <div className="flex gap-2 bg-[#1a1c23] p-1.5 rounded-xl mb-5 overflow-x-auto custom-scrollbar border border-zinc-800/50">
                  {['fluxo', 'receber', 'pagar'].map((tab) => (
                    <button key={tab} onClick={() => setFinanceSubTab(tab)} className={`flex-1 min-w-[100px] text-[10px] font-black uppercase py-2.5 rounded-lg transition-all ${financeSubTab === tab ? 'bg-[#e62020] text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-zinc-800'}`}>
                      {tab === 'fluxo' ? '3. Fluxo de Caixa' : tab === 'receber' ? '4. A Receber' : '5. A Pagar'}
                    </button>
                  ))}
                </div>

                <div className="bg-[#1c1e26]/50 border border-zinc-800/50 rounded-xl p-4">
                  {/* 3. Fluxo de Caixa */}
                  {financeSubTab === 'fluxo' && (
                    <div className="space-y-3">
                      {transactions.length > 0 ? transactions.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-[#0f1115] p-3.5 rounded-lg border border-zinc-800/80 hover:border-[#e62020]/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${t.type === 'entrada' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {t.type === 'entrada' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-white text-xs font-bold uppercase">{t.desc}</p>
                              <p className="text-zinc-500 text-[9px] font-semibold mt-0.5">{t.date} • {t.category} • {t.method || 'S/M'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                              {t.type === 'entrada' ? '+' : '-'} R$ {t.value.toFixed(2)}
                            </p>
                            <span className={`text-[7px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${t.status === 'Pago' ? 'bg-green-500/20 text-green-400' : t.status === 'Parcial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-700 text-zinc-300'}`}>{t.status}</span>
                          </div>
                        </div>
                      )) : <p className="text-center text-zinc-500 text-xs py-6">Nenhuma movimentação registrada.</p>}
                    </div>
                  )}

                  {/* 4. Contas a Receber */}
                  {financeSubTab === 'receber' && (
                    <div className="space-y-3">
                      {contasAReceber.length > 0 ? contasAReceber.map(os => (
                        <div key={os.id} className="flex justify-between items-center bg-[#0f1115] p-3.5 rounded-lg border border-zinc-800/80">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500"><Receipt className="w-4 h-4" /></div>
                            <div>
                              <p className="text-white text-xs font-bold uppercase">OS: {os.bike}</p>
                              <p className="text-zinc-500 text-[9px] font-semibold mt-0.5">Cliente: {os.client} • Previsão: {os.deadline}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">Restante: R$ {os.pendingAmount.toFixed(2)}</p>
                            <p className="text-[8px] text-zinc-500 font-bold mt-0.5">Total: R$ {(os.cost || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      )) : <p className="text-center text-zinc-500 text-xs py-6">Nenhuma OS pendente de recebimento.</p>}
                    </div>
                  )}

                  {/* 5. Contas a Pagar */}
                  {financeSubTab === 'pagar' && (
                    <div className="space-y-3">
                      {contasAPagar.length > 0 ? contasAPagar.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-[#0f1115] p-3.5 rounded-lg border border-zinc-800/80">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-orange-500/10 text-orange-500"><Calendar className="w-4 h-4" /></div>
                            <div>
                              <p className="text-white text-xs font-bold uppercase">{t.desc}</p>
                              <p className="text-zinc-500 text-[9px] font-semibold mt-0.5">Vencimento: {t.date} • {t.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-red-500">R$ {t.value.toFixed(2)}</p>
                            <span className="text-[7px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block bg-orange-500/20 text-orange-400">Pendente</span>
                          </div>
                        </div>
                      )) : <p className="text-center text-zinc-500 text-xs py-6">Nenhuma conta a pagar registrada.</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'perfil' && (
              <div className="p-5 anim-slide-up lg:py-8 lg:px-0 max-w-4xl">
                <h2 className="text-lg font-black text-white uppercase tracking-wide font-poppins mb-6">Oficina</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-[#1c1e26] border border-zinc-800 rounded-2xl shadow-inner h-fit">
                    <label className="w-24 h-24 rounded-full border-[3px] border-[#e62020] p-1 mb-5 shadow-[0_0_20px_rgba(230,32,32,0.2)] cursor-pointer relative group block transition-transform hover:scale-105">
                       <img src={profileLogo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                       <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Box className="text-white w-5 h-5" />
                       </div>
                       <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                    <h3 className="text-lg font-bold text-white font-poppins uppercase text-center">{profileName}</h3>
                    <p className="text-gray-500 text-[9px] mt-1 font-bold uppercase tracking-widest">Logo da Oficina</p>
                  </div>
                  <div className="lg:col-span-2 space-y-4 bg-black/30 p-6 rounded-2xl border border-zinc-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Nome Fantasia</label>
                        <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-[#e62020] outline-none" placeholder="Nome" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Telefone Comercial</label>
                        <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-[#e62020] outline-none" placeholder="Telefone" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Endereço Completo</label>
                      <input type="text" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-[#e62020] outline-none" placeholder="Endereço" />
                    </div>
                    <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                      <button onClick={handleSaveProfile} className="flex-1 bg-gradient-to-r from-[#e62020] to-[#b31212] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">{isSavingProfile ? 'Salvo!' : 'Salvar Dados'}</button>
                      <button onClick={() => setSession(null)} className="lg:hidden bg-transparent border border-zinc-800 text-gray-400 py-3 px-5 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-800/30"><LogOut className="w-3.5 h-3.5 text-[#e62020]" /> Sair</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          <div className="bg-[#16181d] border-t border-zinc-900 py-3 flex justify-center shrink-0 z-20 shadow-[0_-5px_25px_rgba(0,0,0,0.6)]">
            <button onClick={() => setIsModalOpen(true)} className="w-14 h-14 rounded-full bg-[#2a2d35] border-[5px] border-[#0a0a0c] flex items-center justify-center relative overflow-hidden transition-all duration-500 hover:rotate-90 active:rotate-90 active:scale-95 group shadow-2xl touch-manipulation" style={{ boxShadow: 'inset 0 0 0 2px #6b7280, 0 8px 15px rgba(0,0,0,0.5)' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <div key={i} className="absolute w-2 h-[50%] bg-[#8c919c] origin-bottom top-0 rounded-t-sm" style={{ transform: `rotate(${angle}deg)` }}></div>
                ))}
              </div>
              <div className="w-7 h-7 bg-[#e62020] group-hover:bg-[#f02b2b] transition-colors rounded-full border-2 border-zinc-300 z-10 flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-white shadow-md" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex z-50 anim-backdrop lg:hidden">
          <div className="w-64 bg-[#16181d] h-full shadow-2xl border-r border-zinc-800 flex flex-col anim-slide-in-left">
            <div className="flex justify-between items-center px-5 py-6 border-b border-zinc-800 bg-[#1a1c23]">
              <h2 className="text-lg font-black text-white font-poppins uppercase tracking-wide text-[#e62020]">GOM</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 p-1.5 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col py-5 gap-2.5 px-3 flex-1 overflow-y-auto">
              <SideMenuItem icon={<Home />} label="Início" isActive={activeTab === 'inicio'} onClick={() => { setActiveTab('inicio'); setIsMenuOpen(false); }} />
              <SideMenuItem icon={<Calendar />} label="Agenda" isActive={activeTab === 'agenda'} onClick={() => { setActiveTab('agenda'); setIsMenuOpen(false); }} />
              <SideMenuItem icon={<ClipboardList />} label="Ordens de Serviço" isActive={activeTab === 'ordens'} onClick={() => { setActiveTab('ordens'); setIsMenuOpen(false); }} />
              <SideMenuItem icon={<Wallet />} label="Financeiro" isActive={activeTab === 'financeiro'} onClick={() => { setActiveTab('financeiro'); setIsMenuOpen(false); }} />
              <SideMenuItem icon={<Store />} label="Configurações" isActive={activeTab === 'perfil'} onClick={() => { setActiveTab('perfil'); setIsMenuOpen(false); }} />
            </div>
            <div className="p-5 border-t border-zinc-800 bg-black/20">
              <button onClick={() => { setSession(null); setIsMenuOpen(false); }} className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">
                <LogOut className="w-3.5 h-3.5 text-[#e62020]" /> Sair
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMenuOpen(false)}></div>
        </div>
      )}

      {selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 anim-backdrop p-0 sm:p-4">
          <div className="bg-[#16181d] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[480px] shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[90vh] anim-slide-up">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 bg-[#1a1c23]/50">
              <h2 className="text-base font-black text-white font-poppins uppercase tracking-widest">Gerenciar O.S.</h2>
              <button onClick={() => setSelectedService(null)} className="text-gray-400 p-1.5 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="bg-[#0f1115] border border-zinc-800/50 p-4 rounded-xl shadow-inner">
                <label className="block text-[9px] font-black text-gray-500 mb-2.5 uppercase tracking-widest">Progresso</label>
                <select value={selectedService.status} onChange={(e) => handleUpdateStatus(selectedService.id, e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-xs font-bold focus:border-[#e62020] outline-none shadow-md">
                  <option value="Agendado">Agendado</option>
                  <option value="Recebido">Recebido</option>
                  <option value="Em diagnóstico">Em diagnóstico</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Aguardando peças">Aguardando peças</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>
              <div className="space-y-3 text-xs text-gray-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/30">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Cliente</p>
                    <p className="text-white font-bold truncate">{selectedService.client}</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/30">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Placa</p>
                    <p className="text-[#e62020] font-black">{selectedService.plate}</p>
                  </div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/30">
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Moto</p>
                  <p className="text-white font-bold">{selectedService.bike}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/30">
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">Estimativa</p>
                  <p className="text-green-500 font-black text-base">R$ {selectedService.cost?.toFixed(2)}</p>
                </div>
                <div className="pt-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase mb-1.5 block ml-1">Relatório</label>
                  <div className="bg-[#0f1115] p-4 rounded-xl text-white italic text-[11px] leading-relaxed border border-zinc-800/50">"{selectedService.issue}"</div>
                </div>
              </div>
              <div className="pt-3 pb-1">
                <button onClick={() => setSelectedService(null)} className="w-full bg-zinc-800 text-white py-3 rounded-lg font-black uppercase text-[9px] tracking-widest hover:bg-zinc-700 transition-colors">Voltar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FINANCEIRO */}
      {isFinanceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 anim-backdrop p-0 sm:p-4">
          <div className="bg-[#16181d] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[400px] shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[95vh] anim-slide-up">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 bg-[#1a1c23]/50">
              <h2 className="text-base font-black text-white font-poppins uppercase tracking-widest">Movimentação</h2>
              <button onClick={() => setIsFinanceModalOpen(false)} className="text-gray-400 p-1.5 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateFinance} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="flex gap-2 p-1 bg-[#0f1115] border border-zinc-800 rounded-lg">
                <button type="button" onClick={() => setFinType('entrada')} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-md transition-colors ${finType === 'entrada' ? 'bg-green-600 text-white' : 'text-zinc-500 hover:text-white'}`}>1. Entrada</button>
                <button type="button" onClick={() => setFinType('saida')} className={`flex-1 text-[10px] font-black uppercase py-2 rounded-md transition-colors ${finType === 'saida' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>2. Saída</button>
              </div>

              {finType === 'entrada' ? (
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Vincular a OS</label>
                  <select required value={finOsId} onChange={(e) => setFinOsId(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none">
                    <option value="" disabled>Selecione uma O.S.</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.bike} - {s.client}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Descrição / Fornecedor</label>
                  <input required type="text" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none" placeholder="Ex: Compra de Óleo" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Categoria</label>
                  <select value={finCategory} onChange={(e) => setFinCategory(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none">
                    {finType === 'entrada' ? (
                      <><option>Mão de obra</option><option>Peças</option><option>Outros</option></>
                    ) : (
                      <><option>Fornecedores</option><option>Custos Fixos</option><option>Ferramentas</option></>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Valor</label>
                  <input required type="number" step="0.01" value={finValue} onChange={(e) => setFinValue(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#e62020]" placeholder="0,00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Data</label>
                  <input required type="date" value={finDate} onChange={(e) => setFinDate(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs [color-scheme:dark] outline-none focus:border-[#e62020]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Status</label>
                  <select value={finStatus} onChange={(e) => setFinStatus(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none">
                    <option>Pago</option><option>Pendente</option><option>Parcial</option>
                  </select>
                </div>
              </div>

              {finStatus !== 'Pendente' && (
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Forma de Pagamento</label>
                  <select value={finMethod} onChange={(e) => setFinMethod(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none">
                    <option>PIX</option><option>Dinheiro</option><option>Cartão de Crédito</option><option>Cartão de Débito</option>
                  </select>
                </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-[#e62020] to-[#b31212] text-white py-3.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 mb-1">
                Registrar
              </button>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 anim-backdrop p-0 sm:p-4">
          <div className="bg-[#16181d] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[500px] shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[95vh] anim-slide-up">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 bg-[#1a1c23]/50">
              <h2 className="text-base font-black text-white font-poppins uppercase tracking-widest">Abertura</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-1.5 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateOS} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Proprietário</label>
                    <input required type="text" value={newClient} onChange={(e) => setNewClient(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none" placeholder="Nome" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Placa</label>
                    <input required type="text" value={newPlate} onChange={(e) => setNewPlate(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs uppercase focus:border-[#e62020] outline-none" placeholder="ABC1D23" maxLength={8} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Moto</label>
                  <input required type="text" list="motos-populares" value={newBike} onChange={(e) => setNewBike(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs focus:border-[#e62020] outline-none" placeholder="Modelo" />
                  <datalist id="motos-populares">{POPULAR_BIKES.map((bike, i) => <option key={i} value={bike} />)}</datalist>
                </div>
                
                {newBike.length > 2 && (
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-zinc-800 relative shadow-inner">
                    <img src={getBikeImage(newBike)} alt="Moto" className="w-full h-full object-cover opacity-30 grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] to-transparent"></div>
                    <div className="absolute bottom-1.5 left-3">
                      <p className="text-[7px] font-black text-[#e62020] uppercase tracking-widest">Detectada</p>
                      <p className="text-[10px] font-bold text-white uppercase truncate">{newBike}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Ocorrência</label>
                  <textarea required value={newIssue} onChange={(e) => setNewIssue(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-3 text-white text-xs h-20 sm:h-24 resize-none focus:border-[#e62020] outline-none leading-relaxed" placeholder="Relato do cliente..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Data de agendamento</label>
                    <input required type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs [color-scheme:dark] outline-none focus:border-[#e62020]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Orçamento</label>
                    <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#e62020]" placeholder="0,00" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">Mecânico</label>
                  <input type="text" value={newTech} onChange={(e) => setNewTech(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-xs outline-none focus:border-[#e62020]" placeholder="Nome" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#e62020] to-[#b31212] text-white py-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-3 mb-1">Registrar O.S.</button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        html, body { overflow: hidden; position: fixed; width: 100%; height: 100%; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .anim-fade { animation: fadeIn 0.3s ease-out forwards; }
        .anim-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-slide-in-left { animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-backdrop { animation: backdropFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes backdropFade { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(6px); } }
        .angled-badge { clip-path: polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%); }
        select { appearance: none; -webkit-appearance: none; }
      `}} />
    </div>
  );
}

function StatBox({ icon, title, value, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`bg-[#1c1e26]/60 backdrop-blur-md border rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center text-center h-20 sm:h-24 shadow-lg transition-all duration-300 ${isActive ? 'border-[#e62020] bg-black/40 scale-105 shadow-[#e62020]/10' : 'border-zinc-800 hover:border-zinc-600 hover:scale-[1.02]'}`}
    >
      <div className={`${isActive ? 'text-[#e62020]' : 'text-[#e62020] opacity-80'} mb-1 sm:mb-1.5`}>{icon}</div>
      <p className={`text-[7px] sm:text-[8px] font-black leading-tight font-inter uppercase tracking-wider ${isActive ? 'text-white' : 'text-gray-500'}`}>{title}</p>
      <h3 className={`font-black text-xs sm:text-base font-poppins mt-0.5 ${isActive ? 'text-[#e62020]' : 'text-white'}`}>{value}</h3>
    </button>
  );
}

function ServiceCard({ service, getStatusStyle, onOpenDetails, onDelete }) {
  const styles = getStatusStyle(service.status);
  return (
    <div className={`relative bg-gradient-to-br from-[#1c1e26] to-[#0a0b0d] rounded-xl overflow-hidden border border-zinc-800/80 shadow-xl ${styles.border} border-l-[5px] group transition-all hover:border-l-[#e62020]`}>
      <div className="absolute inset-y-0 right-0 w-3/4 bg-cover opacity-10 grayscale group-hover:opacity-20 group-hover:grayscale-0 transition-all duration-700 z-0" style={{ backgroundImage: `url(${service.image})` }}></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c1e26] via-[#1c1e26]/90 to-transparent z-0"></div>
      <div className="relative z-10 p-4 flex flex-col h-full justify-between gap-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-[11px] sm:text-xs font-poppins leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-[#e62020] transition-colors">{service.issue}</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[90px]">{service.bike}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              <span className="text-[8px] sm:text-[9px] text-[#e62020] font-black">{service.plate}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onDelete && <button onClick={() => onDelete(service.id)} className="bg-zinc-800/50 text-gray-500 hover:text-[#e62020] hover:bg-zinc-800 p-1.5 rounded-lg border border-zinc-700 transition-all active:scale-90"><Trash2 className="w-3 h-3" /></button>}
            <button onClick={() => onOpenDetails(service)} className="bg-white text-black text-[7px] sm:text-[8px] font-black uppercase px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md hover:bg-[#e62020] hover:text-white transition-all active:scale-95">Gestão</button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2 mt-1.5">
          <span className={`px-2 sm:px-2.5 py-1 text-[6px] sm:text-[7px] font-black uppercase angled-badge pr-3 sm:pr-4 ${styles.badge} shadow-sm`}>{service.status}</span>
          <div className="flex flex-col text-right">
            <span className="text-[6px] sm:text-[7px] text-gray-500 font-bold uppercase">Entrada</span>
            <span className="text-[8px] sm:text-[9px] text-white font-black">{service.deadline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideMenuItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left group ${isActive ? 'bg-gradient-to-r from-[#e62020] to-[#b31212] text-white shadow-lg shadow-[#e62020]/20' : 'text-gray-500 hover:bg-zinc-800/30 hover:text-gray-300'}`}>
      <div className={`${isActive ? 'text-white' : 'text-zinc-600 group-hover:text-[#e62020]'} transition-colors`}>
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
      </div>
      <span className="font-black font-poppins text-[11px] uppercase tracking-widest">{label}</span>
      {isActive && <div className="ml-auto w-1 h-1 bg-white rounded-full animate-pulse"></div>}
    </button>
  );
}
