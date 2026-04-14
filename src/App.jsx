import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  PackageSearch, 
  CheckCircle2, 
  Settings, 
  X, 
  Search,
  ChevronRight,
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
  Eye
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

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
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
  const [profileName, setProfileName] = useState('MotoComando');
  const [profilePhone, setProfilePhone] = useState('(11) 98765-4321');
  const [profileAddress, setProfileAddress] = useState('Av. Principal, 1000');
  const [profileLogo, setProfileLogo] = useState('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
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
      // Validar UUID para evitar erro de sintaxe 22P02 no Postgres
      if (!isValidUUID(session.user.id)) {
        console.warn("ID de usuário antigo detectado. Algumas funções de banco de dados podem falhar.");
        setAuthError("Nota: Sua conta usa um formato antigo. Crie uma nova conta para salvar no banco de dados.");
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setServices(data);
      } else if (error) {
        console.error("Erro ao buscar serviços:", error.message);
      }
    };
    fetchServices();

    const fetchProfile = async () => {
      if (!isValidUUID(session.user.id)) return;

      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfileName(data.name || 'MotoComando');
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
  const activeOSCount = services.filter(s => !['Finalizado', 'Entregue'].includes(s.status)).length;
  const pendingPartsCount = services.filter(s => s.status === 'Aguardando peças').length;
  const doneCount = services.filter(s => ['Finalizado', 'Entregue'].includes(s.status)).length; 

  const delayedCount = services.filter(s => {
    if (['Finalizado', 'Entregue'].includes(s.status)) return false;
    if (!s.deadline_raw) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(s.deadline_raw);
    return deadlineDate < today;
  }).length;

  const handleCreateOS = async (e) => {
    e.preventDefault();
    
    // Agora garantimos um UUID válido para o ID da Ordem de Serviço
    const newId = generateUUID(); 
    
    let formattedDeadline = "A definir";
    if (newDeadline) {
      const [year, month, day] = newDeadline.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      formattedDeadline = `${day} ${months[parseInt(month, 10) - 1]}`;
    }

    const newOS = {
      id: newId,
      user_id: session.user.id,
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
    
    // Adiciona localmente para feedback imediato (Optimistic UI)
    setServices([newOS, ...services]);
    setIsModalOpen(false); 

    if (supabase) {
      // Verificamos se o user_id é um UUID válido antes de tentar inserir
      if (!isValidUUID(session.user.id)) {
        console.error("Erro: user_id não é um UUID válido.");
        setAuthError("Erro de formato: Seu ID de usuário é incompatível. Por favor, crie uma nova conta.");
        return;
      }

      const { error } = await supabase.from('services').insert([newOS]);
      if (error) {
        console.error("Erro ao salvar no Supabase:", error);
        if (error.code === '22P02') {
          setAuthError("Erro de compatibilidade: Sua conta possui um formato de ID antigo. Por favor, crie uma nova conta.");
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
    if (supabase) {
      await supabase.from('services').update({ status: newStatus }).eq('id', id);
    }
  };

  const handleDeleteOS = async (id) => {
    setServices(services.filter(s => s.id !== id));
    if (supabase) {
      await supabase.from('services').delete().eq('id', id);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    if (supabase && session) {
      await supabase.from('profiles').upsert([{
        id: session.user.id,
        name: profileName,
        phone: profilePhone,
        address: profileAddress,
        logo_url: profileLogo
      }]);
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
        // Agora garantimos um UUID válido para o novo usuário
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
          setAuthError('Erro ao cadastrar: ' + error.message);
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
      <div className="flex justify-center bg-[#12141a] h-screen w-full font-inter overflow-hidden relative">
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#12141a]/90 via-[#12141a]/95 to-[#0a0b0e]"></div>
        <div className="w-full sm:max-w-[400px] h-full flex flex-col items-center relative z-10 px-8 pt-16 pb-10">
          <div className="text-center mb-10 anim-fade flex flex-col items-center">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase font-poppins italic">
              Moto<span className="text-[#e62020] not-italic">Comando</span>
            </h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.25em] mt-2 font-bold opacity-80">Gestão Inteligente para Oficinas</p>
          </div>
          <div className="w-full overflow-y-auto custom-scrollbar pr-1 pb-4 flex flex-col gap-6 anim-slide-up flex-1 relative z-20">
            <form onSubmit={handleLogin} className="w-full space-y-4">
              {isSignUp && (
                <div className="space-y-3">
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                    <input required type="text" value={suWorkshopName} onChange={(e) => setSuWorkshopName(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="Nome da Oficina" />
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                    <input required type="text" value={suTaxId} onChange={(e) => setSuTaxId(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="CNPJ / CPF" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                    <input required type="text" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="Telefone Comercial" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                    <input required type="text" value={suAddress} onChange={(e) => setSuAddress(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="Endereço Completo" />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                    <input required type="text" value={suPersonalName} onChange={(e) => setSuPersonalName(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="Seu Nome (Responsável)" />
                  </div>
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="E-mail" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e62020]" />
                <input required type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-[#e62020] text-sm" placeholder="Senha" />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              </div>
              {authError && <p className="text-[#e62020] text-xs text-center font-bold bg-red-900/10 py-3 rounded-lg border border-red-900/20">{authError}</p>}
              <button disabled={isAuthLoading} type="submit" className="w-full h-16 bg-gradient-to-r from-[#e62020] to-[#b31212] hover:from-[#f02b2b] hover:to-[#c41515] text-white rounded-xl text-lg font-black transition-all shadow-[0_4px_20px_rgba(230,32,32,0.4)] font-poppins uppercase tracking-widest mt-4">
                {isAuthLoading ? 'Processando...' : (isSignUp ? 'Criar já!' : 'Entrar no Sistema')}
              </button>
            </form>
            <div className="text-center mt-4 pb-20">
              <p className="text-gray-400 text-xs font-bold">{isSignUp ? 'Já possui uma conta?' : 'Ainda não tem uma conta?'}</p>
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }} className="text-[#e62020] text-xs font-black uppercase tracking-widest mt-2 hover:text-white transition-colors">
                {isSignUp ? 'Fazer Login' : 'Criar já!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-black h-screen w-full font-inter overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90"></div>
      <div className="w-full sm:max-w-[480px] bg-[#0f1115] h-full flex flex-col relative shadow-2xl overflow-hidden sm:border-x border-zinc-900 z-10">
        <header className="pt-8 pb-4 px-5 shrink-0 z-10 flex justify-between items-center bg-[#0f1115]">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="text-white hover:text-[#e62020] transition-colors active:scale-95">
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right flex items-center gap-3">
              <p className="text-gray-300 text-sm font-medium">Oficina: <strong className="text-white">{profileName}</strong></p>
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-300" />
                {delayedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#e62020] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#0f1115] animate-pulse">
                    {delayedCount}
                  </span>
                )}
              </div>
            </div>
            <img src={profileLogo} alt="Profile" className="w-10 h-10 rounded-full border border-zinc-700 object-cover" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'inicio' && (
            <div className="anim-slide-up">
              <div className="px-4 grid grid-cols-4 gap-2 mb-4">
                <StatBox icon={<Wrench className="w-5 h-5" />} title="Ativas" value={activeOSCount} />
                <StatBox icon={<PackageSearch className="w-5 h-5" />} title="Peças" value={pendingPartsCount} />
                <StatBox icon={<CheckCircle2 className="w-5 h-5" />} title="Concluídos" value={doneCount} />
                <StatBox icon={<DollarSign className="w-5 h-5" />} title="Hoje" value={`R$ ${totalIncome}`} />
              </div>
              <hr className="border-[#e62020] border-t-2 opacity-80" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-wide font-poppins">Ordens de Serviço</h2>
                  <button onClick={() => setActiveTab('ordens')} className="text-sm text-gray-400 font-medium flex items-center hover:text-white transition-colors">
                    Ver Todas <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {services.length > 0 ? (
                    services.slice(0, 2).map((service) => (
                      <ServiceCard key={service.id} service={service} getStatusStyle={getStatusStyle} onOpenDetails={setSelectedService} />
                    ))
                  ) : (
                    <div className="bg-[#1c1e26] border border-dashed border-zinc-800 rounded-lg p-6 text-center text-gray-500 text-sm">
                      Nenhuma ordem de serviço cadastrada.
                    </div>
                  )}
                </div>
              </div>
              <hr className="border-[#e62020] border-t-2 opacity-80" />
              <div className="p-4">
                <h2 className="text-lg font-black text-white uppercase tracking-wide font-poppins mb-4">Agenda de Hoje</h2>
                <div className="space-y-3 mb-6">
                  {AGENDA_TODAY.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-gray-300 font-medium pb-3 border-b border-zinc-800/50 last:border-0">
                      <span className="text-white font-bold w-12">{item.time}</span>
                      <span className="text-sm">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ordens' && (
            <div className="p-6 anim-slide-up">
              <h2 className="text-xl font-black text-white uppercase tracking-wide font-poppins mb-4">Todas as Ordens</h2>
              <div className="relative mb-6">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar por cliente ou moto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#1a1c23] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#e62020]" />
              </div>
              <div className="space-y-4">
                {services.filter(s => s.bike.toLowerCase().includes(searchTerm.toLowerCase()) || s.client.toLowerCase().includes(searchTerm.toLowerCase())).map((service) => (
                  <ServiceCard key={service.id} service={service} getStatusStyle={getStatusStyle} onOpenDetails={setSelectedService} onDelete={handleDeleteOS} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="p-6 anim-slide-up">
              <h2 className="text-xl font-black text-white uppercase tracking-wide font-poppins mb-6">Configurações</h2>
              <div className="flex flex-col items-center justify-center p-6 bg-[#1c1e26] border border-zinc-800 rounded-lg shadow-inner mb-6">
                <label className="w-24 h-24 rounded-full border-2 border-[#e62020] p-1 mb-4 shadow-[0_0_15px_rgba(230,32,32,0.3)] cursor-pointer relative group block">
                   <img src={profileLogo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                   <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
                <h3 className="text-xl font-bold text-white font-poppins uppercase">{profileName}</h3>
              </div>
              <div className="space-y-4">
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Nome" />
                <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Telefone" />
                <input type="text" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Endereço" />
                <button onClick={handleSaveProfile} className="w-full bg-gradient-to-b from-[#e62020] to-[#b31212] text-white py-3.5 rounded-md text-sm font-black uppercase">{isSavingProfile ? 'Salvo!' : 'Salvar Alterações'}</button>
                <button onClick={() => setSession(null)} className="w-full bg-transparent border border-zinc-800 text-gray-400 py-3.5 rounded-md text-sm font-black uppercase flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Sair</button>
              </div>
            </div>
          )}
        </main>

        <div className="bg-[#16181d] border-t border-zinc-900 py-4 flex justify-center shrink-0 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
          <button onClick={() => setIsModalOpen(true)} className="w-20 h-20 rounded-full bg-[#2a2d35] border-8 border-[#0a0a0c] flex items-center justify-center relative overflow-hidden transition-all duration-500 hover:rotate-90 active:scale-95 group shadow-lg" style={{ boxShadow: 'inset 0 0 0 3px #6b7280, 0 4px 10px rgba(0,0,0,0.5)' }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-80">
              {[0, 72, 144, 216, 288].map((angle, i) => (
                <div key={i} className="absolute w-2.5 h-[50%] bg-[#8c919c] origin-bottom top-0 rounded-t-sm" style={{ transform: `rotate(${angle}deg)` }}></div>
              ))}
            </div>
            <div className="w-10 h-10 bg-[#e62020] group-hover:bg-[#f02b2b] transition-colors rounded-full border-2 border-zinc-300 z-10 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex z-50 anim-backdrop">
            <div className="w-64 bg-[#16181d] h-full shadow-2xl border-r border-zinc-800 flex flex-col anim-slide-in-left">
              <div className="flex justify-between items-center px-5 py-6 border-b border-zinc-800 bg-[#1a1c23]">
                <h2 className="text-lg font-black text-white font-poppins uppercase tracking-wide text-[#e62020]">MotoComando</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 p-1 bg-zinc-800/50 rounded-md"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col py-4 gap-2 px-3 flex-1 overflow-y-auto">
                <SideMenuItem icon={<Home />} label="Início" isActive={activeTab === 'inicio'} onClick={() => { setActiveTab('inicio'); setIsMenuOpen(false); }} />
                <SideMenuItem icon={<ClipboardList />} label="Ordens" isActive={activeTab === 'ordens'} onClick={() => { setActiveTab('ordens'); setIsMenuOpen(false); }} />
                <SideMenuItem icon={<Store />} label="Perfil" isActive={activeTab === 'perfil'} onClick={() => { setActiveTab('perfil'); setIsMenuOpen(false); }} />
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMenuOpen(false)}></div>
          </div>
        )}

        {selectedService && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 anim-backdrop">
            <div className="bg-[#16181d] rounded-t-2xl w-full sm:max-w-[480px] shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[85vh] anim-slide-up">
              <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 bg-[#1a1c23]">
                <h2 className="text-lg font-black text-white font-poppins uppercase tracking-wide">Gerenciar OS</h2>
                <button onClick={() => setSelectedService(null)} className="text-gray-400 p-1 bg-zinc-800/50 rounded-md"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="bg-[#0f1115] border border-zinc-800 p-4 rounded-lg">
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Status Atual</label>
                  <select value={selectedService.status} onChange={(e) => handleUpdateStatus(selectedService.id, e.target.value)} className="w-full bg-[#1a1c23] border border-zinc-700 rounded-md px-3 py-2 text-white text-sm">
                    <option value="Agendado">Agendado</option>
                    <option value="Recebido">Recebido</option>
                    <option value="Em diagnóstico">Em diagnóstico</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando peças">Aguardando peças</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <p className="flex justify-between border-b border-zinc-800 pb-2"><strong>Cliente:</strong> {selectedService.client}</p>
                  <p className="flex justify-between border-b border-zinc-800 pb-2"><strong>Moto:</strong> {selectedService.bike}</p>
                  <p className="flex justify-between border-b border-zinc-800 pb-2"><strong>Placa:</strong> {selectedService.plate}</p>
                  <p className="flex justify-between border-b border-zinc-800 pb-2"><strong>Valor:</strong> R$ {selectedService.cost?.toFixed(2)}</p>
                  <div className="pt-2">
                    <p className="text-gray-400 mb-1">Problema relatado:</p>
                    <div className="bg-[#0f1115] p-3 rounded text-white italic">{selectedService.issue}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 anim-backdrop">
            <div className="bg-[#16181d] rounded-t-2xl w-full sm:max-w-[480px] shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[85vh] anim-slide-up">
              <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 bg-[#1a1c23]">
                <h2 className="text-lg font-black text-white font-poppins uppercase tracking-wide">Nova OS</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-1 bg-zinc-800/50 rounded-md"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateOS} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                <input required type="text" value={newClient} onChange={(e) => setNewClient(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Nome do Cliente" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" list="motos-populares" value={newBike} onChange={(e) => setNewBike(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Moto" />
                  <datalist id="motos-populares">{POPULAR_BIKES.map((bike, i) => <option key={i} value={bike} />)}</datalist>
                  <input required type="text" value={newPlate} onChange={(e) => setNewPlate(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm uppercase" placeholder="Placa" maxLength={8} />
                </div>
                {newBike.length > 2 && (
                  <div className="w-full h-24 rounded-md overflow-hidden border border-zinc-800 relative">
                    <img src={getBikeImage(newBike)} alt="Moto Selecionada" className="w-full h-full object-cover opacity-50 grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] to-transparent"></div>
                    <p className="absolute bottom-2 left-3 text-[10px] font-bold text-white uppercase tracking-wider">{newBike}</p>
                  </div>
                )}
                <textarea required value={newIssue} onChange={(e) => setNewIssue(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm h-24 resize-none" placeholder="Descrição do problema" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm [color-scheme:dark]" />
                  <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Valor Estimado" />
                </div>
                <input type="text" value={newTech} onChange={(e) => setNewTech(e.target.value)} className="w-full bg-[#0f1115] border border-zinc-800 rounded-md px-4 py-3 text-white text-sm" placeholder="Técnico Responsável" />
                <button type="submit" className="w-full bg-gradient-to-b from-[#e62020] to-[#b31212] text-white py-4 rounded-md text-sm font-black uppercase tracking-wider shadow-lg">Salvar OS</button>
              </form>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .anim-fade { animation: fadeIn 0.3s ease-out forwards; }
        .anim-slide-up { animation: slideUp(25px); animation-duration: 0.4s; animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); animation-fill-mode: forwards; }
        .anim-slide-in-left { animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-backdrop { animation: backdropFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes backdropFade { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(4px); } }
        .angled-badge { clip-path: polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%); }
      `}} />
    </div>
  );
}

function StatBox({ icon, title, value }) {
  return (
    <div className="bg-[#1c1e26] border border-zinc-800 rounded-md p-2 flex flex-col items-center justify-center text-center h-24 shadow-inner">
      <div className="text-gray-400 mb-1">{icon}</div>
      <p className="text-[10px] text-gray-400 font-semibold leading-tight font-inter uppercase">{title}</p>
      <h3 className="font-black text-white text-base font-poppins">{value}</h3>
    </div>
  );
}

function ServiceCard({ service, getStatusStyle, onOpenDetails, onDelete }) {
  const styles = getStatusStyle(service.status);
  return (
    <div className={`relative bg-gradient-to-r from-[#1c1e26] to-[#12141a] rounded-md overflow-hidden border border-zinc-800 shadow-md ${styles.border} border-l-4 group`}>
      <div className="absolute inset-y-0 right-0 w-1/2 bg-cover opacity-30 grayscale z-0" style={{ backgroundImage: `url(${service.image})` }}></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c1e26] via-[#1c1e26]/90 to-transparent z-0"></div>
      <div className="relative z-10 p-4 flex flex-col h-full justify-between gap-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-white text-sm font-poppins leading-tight line-clamp-1">{service.issue}</h3>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wide mt-1">{service.bike}</p>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && <button onClick={() => onDelete(service.id)} className="bg-[#1c1e26] text-gray-400 hover:text-[#e62020] p-1.5 rounded border border-zinc-700 transition-colors"><Trash2 className="w-3 h-3" /></button>}
            <button onClick={() => onOpenDetails(service)} className="bg-gradient-to-b from-[#e62020] to-[#b31212] text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded shadow-sm">Detalhes</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase angled-badge pr-4 ${styles.badge}`}>{service.status}</span>
          <span className="text-[10px] text-white font-medium">Prazo: {service.deadline}</span>
        </div>
      </div>
    </div>
  );
}

function SideMenuItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 px-4 py-3.5 rounded-lg transition-colors w-full text-left ${isActive ? 'bg-gradient-to-r from-[#e62020]/20 to-transparent text-white border-l-2 border-[#e62020]' : 'text-gray-400 border-l-2 border-transparent hover:bg-zinc-800/50'}`}>
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      <span className="font-medium font-poppins text-sm uppercase tracking-wide">{label}</span>
    </button>
  );
}