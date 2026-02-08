import React, { useState, useRef, useEffect } from 'react';
import { Menu, Mic, ChevronUp, Send, Plus, Move, X, Play, RotateCw, Upload, FileText, Image as ImageIcon, Music, Film, Maximize2, Trash2, Paperclip, Download, RefreshCw, Pause, Settings, Sliders, Volume2, Video, Layers, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

interface MainAppProps {
  userData: {
    companyName: string;
    logo?: File | null;
  };
  initialMode: 'agent' | 'creator';
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  videoUrl?: string;
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  date: Date;
}

// Node Data Interface — one node per backend pipeline stage
interface WorkflowNodeData {
  id: string;
  type: 'input' | 'scenes' | 'script' | 'visuals' | 'animations' | 'tts' | 'render';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isProcessing: boolean;
  isComplete: boolean;
  content: any;
}

const QUICK_ACTIONS = [
  'Clinical Ads',
  'Consumer Ads',
  'Disease awareness',
  'Mechanism of action',
  'Compliance',
  'Social media'
];

const CREATE_ENDPOINTS: Record<string, string> = {
  'Clinical Ads': "/create-doctor",
  'Consumer Ads': "/create-sm-rm",
  'Disease awareness': "/create",
  'Mechanism of action': "/create-moa",
  'Compliance': "/create-compliance",
  'Social media': "/create-sm"
};

interface VideoConfig {
  quality?: 'low' | 'medium' | 'high';
  tone: string;
  persona: string;
  brand_name?: string;
  target_audience?: string;
  integrate_sadtalker?: boolean;
  indication?: string;
  key_benefit?: string;
  clinical_data?: string;
  moa_summary?: string;
  condition?: string;
  region?: string;
}

const DEFAULT_CONFIGS: Record<string, VideoConfig> = {
  'Clinical Ads': {
    indication: "General Indication",
    moa_summary: "",
    clinical_data: "",
    persona: "professional medical narrator",
    tone: "scientific and professional",
    quality: "low"
  },
  'Consumer Ads': {
    brand_name: "",
    persona: "friendly brand narrator",
    tone: "engaging and conversational",
    quality: "high",
    integrate_sadtalker: false
  },
  'Disease awareness': {
    brand_name: "",
    persona: "professional narrator",
    tone: "clear and reassuring",
    region: "global"
  },
  'Mechanism of action': {
    condition: "General Condition",
    target_audience: "healthcare professionals",
    persona: "professional medical narrator",
    tone: "clear and educational",
    quality: "low"
  },
  'Compliance': {
    brand_name: "",
    persona: "compliance officer",
    tone: "formal and precise"
  },
  'Social media': {
    indication: "General Indication",
    key_benefit: "",
    target_audience: "patients",
    persona: "friendly health narrator",
    tone: "engaging and conversational",
    quality: "low"
  }
};

// Animation Constants
const ANIM_DURATION = 220;
const ANIM_STAGGER = 70;
const UI_SWAP_DELAY = 600;

// Fallback Key provided by user
const USER_FALLBACK_KEY = "AIzaSyCfeB7MtwyQ9ipV9mTiaPwMeJ0YfEFz35U";

const getAnimationDelay = (index: number) => `${index * ANIM_STAGGER}ms`;

// Helper to call Gemini
const generateGeminiText = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY || USER_FALLBACK_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "No response text";
  } catch (e) {
    console.warn("Gemini API failed, using mock.", e);
    if (prompt.includes("scenes")) return `Scene 1: The Struggle\n[Visual: A busy office, person rubbing temples]\nNarrator: "Headaches shouldn't dictate your day."\n\nScene 2: The Relief\n[Visual: Taking the medication, smiling]\nNarrator: "Find clarity fast."`;
    if (prompt.includes("script")) return "Headaches shouldn't dictate your day. Find clarity fast with our advanced formula. Back to the moments that matter.";
    return "Generated content unavailable.";
  }
};

// Sub-component for Video Node content to handle player state
const VideoNodeContent = ({ url, onRegenerate }: { url: string, onRegenerate: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full text-white/90">
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </div>
      </div>

      <div className="absolute bottom-1 right-1 flex gap-2 pointer-events-auto z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
          className="p-2 bg-white hover:bg-emerald-50 rounded-full text-gray-600 hover:text-emerald-600 shadow-sm border border-gray-100 transition-colors"
          title="Regenerate"
        >
          <RefreshCw size={14} />
        </button>
        <button
          className="p-2 bg-[#006838] hover:bg-[#00502b] rounded-full text-white shadow-sm transition-colors"
          title="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

const MainApp: React.FC<MainAppProps> = ({ userData, initialMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'agent' | 'creator'>(initialMode);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedMode(initialMode);
  }, [initialMode]);

  const handleModeSwitch = (mode: 'agent' | 'creator') => {
    setSelectedMode(mode);
    navigate(`/${mode}`);
  };

  // Input & Chips State
  const [inputValue, setInputValue] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // NEW: File Upload States
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);

  // Chat History State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Canvas State
  const [showCanvas, setShowCanvas] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [creatorAction, setCreatorAction] = useState<string | null>(null);

  // Workflow Nodes State
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const dragNodeOffset = useRef({ x: 0, y: 0 });
  const nodesRef = useRef<WorkflowNodeData[]>([]);

  // Keep nodesRef always up-to-date
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // WebSocket State for Creator Mode
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const pendingActionRef = useRef<string | null>(null);

  // Keep currentVideoIdRef always up-to-date
  useEffect(() => {
    currentVideoIdRef.current = currentVideoId;
  }, [currentVideoId]);

  // Toast Notification State
  const [toast, setToast] = useState<{message: string; type: 'info' | 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Execution & UI State
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Execution Status
  const isGlobalProcessing = nodes.some(n => n.isProcessing);

  useEffect(() => {
    if (userData.logo) {
      const url = URL.createObjectURL(userData.logo);
      setLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [userData.logo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedMode === 'creator') {
      const timer = setTimeout(() => setShowCanvas(true), UI_SWAP_DELAY);
      return () => clearTimeout(timer);
    } else {
      setShowCanvas(false);
      // Disconnect WebSocket when leaving creator mode
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
    }
  }, [selectedMode]);

  // --- WORKFLOW LOGIC ---

  // Use a ref so WebSocket always calls the latest handler
  const handleWsMessageRef = useRef<(data: any) => void>(() => {});
  useEffect(() => {
    handleWsMessageRef.current = handleWebSocketMessage;
  });

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket('ws://localhost:8000/ws/creator');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWsMessageRef.current(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      wsRef.current = null;
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message:', data);

    if (data.status === 'session_started') {
      setCurrentVideoId(data.video_id);
      console.log(`✅ Session started: ${data.video_id}`);
      console.log(`📋 Stages: ${data.stage_order?.join(' → ')}`);
      showToast('Creator session started!', 'success');

      // Remove nodes for stages not in this pipeline's stage_order
      // and reposition remaining nodes
      if (data.stage_order) {
        const backendStages: string[] = data.stage_order;
        setNodes(prev => {
          const filtered = prev.filter(n =>
            n.type === 'input' || backendStages.includes(n.type)
          );
          const gapX = 320;
          return filtered.map((n, i) => ({
            ...n,
            id: String(i + 1),
            x: i * gapX,
            y: i % 2 === 0 ? 80 : 160, // stagger vertical position
          }));
        });
      }
    }

    else if (data.status === 'stage_running') {
      const stage = data.stage;
      console.log(`⏳ Running stage: ${stage} (version ${data.version})`);
      showToast(`Processing: ${stage}...`, 'info');
      updateNodeByStage(stage, {}, false, true);
    }

    else if (data.status === 'completed') {
      const stage = data.stage;
      const stageData = data.data;
      console.log(`✅ Stage completed: ${stage}`);
      console.log(`📦 Stage data:`, stageData);
      console.log(`📊 Progress: ${data.progress?.current}/${data.progress?.total}`);
      showToast(`${stage} completed!`, 'success');
      updateNodeByStage(stage, stageData, true, false);
    }

    else if (data.status === 'error') {
      const stage = data.stage;
      console.error(`❌ Stage ${stage} failed:`, data.error);
      showToast(`Error in ${stage}: ${data.error}`, 'error');
      updateNodeByStage(stage, {}, false, false);
      alert(`Error in ${stage}: ${data.error}`);
    }

    else if (data.status === 'pipeline_complete') {
      console.log('🎉 Pipeline complete!');
      console.log(`📁 Video path: ${data.video_path}`);
      showToast('Video generation complete! 🎉', 'success');
      const renderNode = nodesRef.current.find(n => n.type === 'render');
      if (renderNode) {
        let videoUrl = data.video_path;
        if (videoUrl && !videoUrl.startsWith('http')) {
          videoUrl = `http://localhost:8000${videoUrl}`;
        }
        updateNodeContent(renderNode.id, { url: videoUrl }, true, false);
      }
    }
  };

  const updateNodeByStage = (stage: string, stageData: any, isComplete: boolean, isProcessing: boolean) => {
    // Stage names map 1:1 to node types
    const validStages = ['scenes', 'script', 'visuals', 'animations', 'tts', 'render'];
    if (!validStages.includes(stage)) return;

    setNodes(prev => {
      const nodeIndex = prev.findIndex(n => n.type === stage);
      if (nodeIndex === -1) return prev;

      const node = prev[nodeIndex];

      // When marking as processing, keep existing content
      if (isProcessing && !isComplete) {
        const updated = [...prev];
        updated[nodeIndex] = { ...node, isProcessing: true, isComplete: false };
        return updated;
      }

      let newContent = { ...node.content };

      if (stage === 'scenes' && stageData?.scenes_data?.scenes) {
        const scenes = stageData.scenes_data.scenes;
        const scenesText = scenes.map((s: any) =>
          `🎬 Scene ${s.scene_id}: ${s.concept}\n` +
          `⏱ Duration: ${s.duration_sec}s\n` +
          `🔍 Search: ${s.pexels_search_terms?.join(', ') || 'N/A'}`
        ).join('\n\n');
        newContent = { text: scenesText, sceneCount: scenes.length };
      }

      else if (stage === 'script' && stageData?.script) {
        const scriptItems = Array.isArray(stageData.script) ? stageData.script : [];
        const scriptText = scriptItems.map((s: any) =>
          `🎤 Scene ${s.scene_id}:\n${s.script}`
        ).join('\n\n---\n\n');
        newContent = { text: scriptText || 'Script generated', scriptCount: scriptItems.length };
      }

      else if (stage === 'visuals') {
        newContent = { text: stageData?.message || 'Compositions generated ✅' };
      }

      else if (stage === 'animations') {
        const status = stageData?.status || 'complete';
        newContent = { text: stageData?.message || (status === 'skipped' ? 'Animations skipped ⏭' : 'Animations generated ✅') };
      }

      else if (stage === 'tts') {
        const audioCount = stageData?.audio_count || 0;
        newContent = { text: stageData?.message || `🔊 Generated ${audioCount} audio files` };
      }

      else if (stage === 'render' && stageData?.video_path) {
        let videoUrl = stageData.video_path;
        if (!videoUrl.startsWith('http')) {
          videoUrl = `http://localhost:8000${videoUrl}`;
        }
        newContent = { url: videoUrl, videoId: stageData?.video_id };
      }

      const updated = [...prev];
      updated[nodeIndex] = {
        ...node,
        content: newContent,
        isComplete,
        isProcessing
      };
      return updated;
    });
  };

  const sendWebSocketMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  };

  const initializeWorkflow = (actionName: string) => {
    const formattedTitle = actionName.replace(/Ads/g, "Advertisements");
    setCreatorAction(formattedTitle);

    setPan({ x: 100, y: 100 });
    setScale(1);

    const gapX = 320;
    const baseWidth = 280;
    const baseHeight = 260;
    const videoNodeWidth = 480;
    const videoNodeHeight = 360;

    // Nodes match the backend pipeline stages 1:1
    const newNodes: WorkflowNodeData[] = [
      {
        id: '1', type: 'input', title: 'Context Input',
        x: 0, y: 120, width: baseWidth, height: 200,
        isProcessing: false, isComplete: true,
        content: { text: inputValue || `Create a ${actionName} video` }
      },
      {
        id: '2', type: 'scenes', title: 'Scenes',
        x: gapX, y: 60, width: baseWidth, height: baseHeight,
        isProcessing: false, isComplete: false,
        content: { text: '' }
      },
      {
        id: '3', type: 'script', title: 'Script',
        x: gapX * 2, y: 140, width: baseWidth, height: baseHeight,
        isProcessing: false, isComplete: false,
        content: { text: '' }
      },
      {
        id: '4', type: 'visuals', title: 'Visuals',
        x: gapX * 3, y: 40, width: baseWidth, height: baseHeight,
        isProcessing: false, isComplete: false,
        content: { text: '' }
      },
      {
        id: '5', type: 'animations', title: 'Animations',
        x: gapX * 4, y: 160, width: baseWidth, height: baseHeight,
        isProcessing: false, isComplete: false,
        content: { text: '' }
      },
      {
        id: '6', type: 'tts', title: 'Text-to-Speech',
        x: gapX * 5, y: 60, width: baseWidth, height: baseHeight,
        isProcessing: false, isComplete: false,
        content: { text: '' }
      },
      {
        id: '7', type: 'render', title: 'Final Video',
        x: gapX * 6, y: 100, width: videoNodeWidth, height: videoNodeHeight,
        isProcessing: false, isComplete: false,
        content: { url: null }
      }
    ];
    setNodes(newNodes);

    // Store raw action name for when user manually triggers first stage
    pendingActionRef.current = actionName;

    // Connect WebSocket only — do NOT auto-start the session
    // User must click the play button on the Scenes node to begin
    connectWebSocket();
  };

  const startCreatorSession = (actionName: string) => {
    const currentInput = inputValue.trim() || `Create a ${actionName} video`;
    const config = videoSettings[actionName] || DEFAULT_CONFIGS[actionName];

    let payload: any = {
      topic: currentInput,
      persona: config.persona,
      tone: config.tone,
    };

    // Add action-specific fields
    if (actionName === 'Clinical Ads') {
      payload.drug_name = currentInput;
      payload.indication = config.indication;
      payload.moa_summary = config.moa_summary;
      payload.clinical_data = config.clinical_data;
    } else if (actionName === 'Consumer Ads') {
      payload.brand_name = config.brand_name;
      payload.quality = config.quality;
    } else if (actionName === 'Disease awareness') {
      payload.brand_name = config.brand_name;
    } else if (actionName === 'Mechanism of action') {
      payload.drug_name = currentInput;
      payload.condition = config.condition;
      payload.target_audience = config.target_audience;
    } else if (actionName === 'Compliance') {
      payload.prompt = currentInput;
      payload.brand_name = config.brand_name;
    } else if (actionName === 'Social media') {
      payload.drug_name = currentInput;
      payload.indication = config.indication;
      payload.key_benefit = config.key_benefit;
      payload.target_audience = config.target_audience;
    }

    const message = {
      action: 'start',
      video_type: 'product_ad', // All use product_ad for now
      payload: payload
    };

    sendWebSocketMessage(message);
    setInputValue('');
  };

  // Video Configuration State
  const [showSettings, setShowSettings] = useState(false);
  const [videoSettings, setVideoSettings] = useState<Record<string, VideoConfig>>(DEFAULT_CONFIGS);
  const [settingsContext, setSettingsContext] = useState<string>('Clinical Ads');

  const handleSettingChange = (key: keyof VideoConfig, value: any) => {
    setVideoSettings(prev => ({
      ...prev,
      [settingsContext]: {
        ...prev[settingsContext],
        [key]: value
      }
    }));
  };

  // Handle Quick Action Click
  const handleQuickAction = async (text: string) => {
    if (!userData || !userData.companyName) {
      alert("Please complete onboarding first.");
      return;
    }

    setSettingsContext(text);

    if (selectedMode === 'agent') {
      setActiveChip(text);
    } else {
      initializeWorkflow(text);
    }
  };

  // Execute video creation with proper backend integration
  const executeVideoCreation = async (actionType: string) => {
    const endpoint = CREATE_ENDPOINTS[actionType];
    if (!endpoint) return;

    const currentInput = inputValue.trim() || `Create a ${actionType} video`;
    const userId = localStorage.getItem("user_id");

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: `[Action: ${actionType}] ${currentInput}`
    };

    const loadingMsgId = (Date.now() + 1).toString();
    const loadingMsg: Message = {
      id: loadingMsgId,
      role: 'ai',
      isLoading: true,
      text: `Creating ${actionType} video...`
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInputValue('');

    // Build FormData with proper file uploads
    const formData = new FormData();
    formData.append('user_id', userId || '');

    const config = videoSettings[actionType] || DEFAULT_CONFIGS[actionType];

    // Add files based on action type
    if (uploadedLogo) {
      formData.append('logo', uploadedLogo);
    }

    // Add multiple images
    uploadedImages.forEach(image => {
      formData.append('images', image);
    });

    // Add multiple documents
    uploadedDocuments.forEach(doc => {
      formData.append('documents', doc);
    });

    // Add config based on action type
    if (actionType === 'Clinical Ads') {
      formData.append('drug_name', currentInput);
      formData.append('indication', config.indication || '');
      formData.append('moa_summary', config.moa_summary || '');
      formData.append('clinical_data', config.clinical_data || '');
      formData.append('persona', config.persona);
      formData.append('tone', config.tone);
      formData.append('quality', config.quality || 'low');
    } else if (actionType === 'Consumer Ads') {
      formData.append('topic', currentInput);
      formData.append('brand_name', config.brand_name || '');
      formData.append('persona', config.persona);
      formData.append('tone', config.tone);
      formData.append('quality', config.quality === 'low' ? 'high' : config.quality || 'high');
      formData.append('integrate_sadtalker', config.integrate_sadtalker ? 'true' : 'false');
    } else if (actionType === 'Disease awareness') {
      formData.append('topic', currentInput);
      formData.append('video_type', 'product_ad');
      formData.append('brand_name', config.brand_name || '');
      formData.append('persona', config.persona);
      formData.append('tone', config.tone);
      if (config.region) {
        formData.append('region', config.region);
      }
    } else if (actionType === 'Mechanism of action') {
      formData.append('drug_name', currentInput);
      formData.append('condition', config.condition || '');
      formData.append('target_audience', config.target_audience || 'healthcare professionals');
      formData.append('persona', config.persona);
      formData.append('tone', config.tone);
      formData.append('quality', config.quality || 'low');
    } else if (actionType === 'Compliance') {
      formData.append('prompt', currentInput);
      formData.append('video_type', 'compliance_video');
      formData.append('brand_name', config.brand_name || '');
      formData.append('persona', config.persona);
      formData.append('tone', config.tone);
    } else if (actionType === 'Social media') {
      formData.append('drug_name', currentInput);
      formData.append('indication', config.indication || '');
      formData.append('key_benefit', config.key_benefit || '');
      formData.append('target_audience', config.target_audience || 'patients');
      formData.append('persona', config.persona);
      formData.append('tone', config.tone);
      formData.append('quality', config.quality || 'low');
    }

    const response = await createVideo(endpoint, formData);

    setMessages(prev => prev.map(msg => {
      if (msg.id === loadingMsgId) {
        if (response && response.video_id) {
          let videoUrl = response.video_url || `http://localhost:8000/outputs/videos/${response.video_id}/final.mp4`;

          if (videoUrl.startsWith('/')) {
            videoUrl = `http://localhost:8000${videoUrl}`;
          }

          startPolling(response.video_id, loadingMsgId, videoUrl);
          return {
            ...msg,
            isLoading: true,
            text: `Video generation started! Video ID: ${response.video_id}. Rendering...`,
            role: 'ai'
          };
        } else {
          return {
            ...msg,
            isLoading: false,
            text: `Sorry, I couldn't start the video generation for ${actionType}.`,
            role: 'ai'
          };
        }
      }
      return msg;
    }));

    // Clear uploaded files after successful submission
    setUploadedDocuments([]);
    setUploadedImages([]);
    setUploadedLogo(null);
  };

  const startPolling = (videoId: string, messageId: string, videoUrl: string) => {
    const pollInterval = 5000;
    const maxAttempts = 120;
    let attempts = 0;

    const intervalId = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(videoUrl, { method: 'HEAD' });

        if (res.ok) {
          clearInterval(intervalId);
          console.log(`Video ${videoId} is ready!`);

          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                isLoading: false,
                text: "Your video is ready!",
                videoUrl: videoUrl
              };
            }
            return msg;
          }));
        } else {
          console.log(`Polling video ${videoId}... Attempt ${attempts}`);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              isLoading: false,
              text: "Video generation timed out. Please try again later.",
            };
          }
          return msg;
        }));
      }
    }, pollInterval);
  };

  // --- BACKEND INTEGRATION ---

  const createVideo = async (endpoint: string, formData: FormData) => {
    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Video creation failed: ${errorText}`);
      }
      return await res.json();
    } catch (error) {
      console.error(`Error creating video (${endpoint}):`, error);
      return null;
    }
  };

  const uploadDocument = async (file: File) => {
    try {
      const formData = new FormData();
      const userId = localStorage.getItem("user_id");
      if (!userId) throw new Error("No user_id found");

      formData.append("user_id", userId);
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/chat/upload-document", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    } catch (error) {
      console.error("Document upload error:", error);
      return null;
    }
  };

  const sendMessage = async (message: string) => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) throw new Error("No user_id found");

      const res = await fetch("http://localhost:8000/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: message,
          use_rag: true
        })
      });

      if (!res.ok) throw new Error("Message send failed");
      return await res.json();
    } catch (error) {
      console.error("Message send error:", error);
      return { reply: "Sorry, I encountered an error connecting to the server.", role: "assistant" };
    }
  };

  const handleGenerate = async () => {
    if (!inputValue.trim() && !activeChip && !attachedFile) return;

    const currentInput = inputValue;
    const currentFile = attachedFile;
    const currentChip = activeChip;

    setInputValue('');
    setAttachedFile(null);

    // If there's an active chip (selected action), execute video creation
    if (currentChip && CREATE_ENDPOINTS[currentChip]) {
      await executeVideoCreation(currentChip);
      setActiveChip(null);
      return;
    }

    // Otherwise, handle as normal chat
    const chipText = currentChip ? `[Selected Mode: ${currentChip}] ` : '';
    const fileText = currentFile ? `[Attached: ${currentFile.name}] ` : '';
    const userText = chipText + fileText + currentInput;

    const userMsgId = Date.now().toString();
    const userMsg: Message = { id: userMsgId, role: 'user', text: userText };

    const loadingMsgId = (Date.now() + 1).toString();
    const loadingMsg: Message = { id: loadingMsgId, role: 'ai', isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);

    if (!currentSessionId) {
      const newId = Date.now().toString();
      let title = "New Conversation";
      if (currentInput) {
        title = currentInput.slice(0, 30) + (currentInput.length > 30 ? "..." : "");
      } else if (currentChip) {
        title = currentChip;
      }
      setChatSessions(prev => [{ id: newId, title, date: new Date() }, ...prev]);
      setCurrentSessionId(newId);
    }

    try {
      if (currentFile) {
        await uploadDocument(currentFile);
      }

      const response = await sendMessage(userText);

      setMessages(prev => prev.map(msg => {
        if (msg.id === loadingMsgId) {
          return {
            ...msg,
            isLoading: false,
            text: response.answer || response.reply,
            role: 'ai'
          };
        }
        return msg;
      }));

    } catch (error) {
      console.error("Chat interaction failed:", error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === loadingMsgId) {
          return {
            ...msg,
            isLoading: false,
            text: "Sorry, something went wrong.",
            role: 'ai'
          };
        }
        return msg;
      }));
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setActiveChip(null);
    setAttachedFile(null);
    setCurrentSessionId(null);
    setUploadedDocuments([]);
    setUploadedImages([]);
    setUploadedLogo(null);
  };

  // --- FILE UPLOAD HANDLERS ---

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs = Array.from(files).filter((f: File) =>
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.type === 'text/plain' ||
      f.name.endsWith('.pdf') ||
      f.name.endsWith('.docx') ||
      f.name.endsWith('.txt')
    );

    setUploadedDocuments(prev => [...prev, ...newDocs]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).filter((f: File) =>
      f.type.startsWith('image/')
    );

    setUploadedImages(prev => [...prev, ...newImages]);
  };


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedLogo(e.target.files[0]);
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeLogo = () => {
    setUploadedLogo(null);
  };

  // --- CANVAS & NODE OPERATIONS ---

  const updateNodeContent = (id: string, newContent: any, isComplete?: boolean, isProcessing?: boolean) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          content: { ...n.content, ...newContent },
          isComplete: isComplete !== undefined ? isComplete : n.isComplete,
          isProcessing: isProcessing !== undefined ? isProcessing : n.isProcessing
        };
      }
      return n;
    }));
  };

  const runNodeProcess = async (nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    // If no session started yet (first stage trigger), start the creator session
    if (!currentVideoIdRef.current && pendingActionRef.current) {
      console.log(`▶️ Starting creator session from node: ${node.title}`);
      showToast('Starting creator session...', 'info');
      
      // Wait briefly for WebSocket to be fully connected, then start session
      const waitForConnection = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          startCreatorSession(pendingActionRef.current!);
          pendingActionRef.current = null;
        } else {
          setTimeout(waitForConnection, 200);
        }
      };
      waitForConnection();
      return;
    }

    // If node is complete, this is a regenerate action
    if (node.isComplete) {
      console.log(`🔄 Regenerating stage for node: ${node.title}`);
      showToast(`Regenerating ${node.title}...`, 'info');
      sendWebSocketMessage({ action: 'regenerate' });
      return;
    }

    // If node is not complete and not processing, this is an accept action
    // (automatically accept and move to next stage)
    if (!node.isProcessing) {
      console.log(`✅ Accepting stage for node: ${node.title}`);
      showToast(`Accepted ${node.title}, moving to next stage...`, 'success');
      sendWebSocketMessage({ action: 'accept' });
    }
  };

  const toggleTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
    } else if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setTtsState('idle');
      ttsUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setTtsState('playing');
    }
  };

  // --- CANVAS EVENTS ---

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isGlobalProcessing) return;
    if (selectedMode !== 'creator') return;
    if ((e.target as HTMLElement).closest('.workflow-node')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (selectedMode !== 'creator') return;
    if (draggedNode) {
      const deltaX = (e.clientX - dragNodeOffset.current.x) / scale;
      const deltaY = (e.clientY - dragNodeOffset.current.y) / scale;
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x: deltaX, y: deltaY } : n));
      return;
    }
    if (isPanning) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  };

  const handleCanvasMouseUp = () => { setIsPanning(false); setDraggedNode(null); };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectedMode !== 'creator') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * 0.001), 3);
      setScale(newScale);
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const startDragNode = (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    dragNodeOffset.current = { x: e.clientX - (nodeX * scale), y: e.clientY - (nodeY * scale) };
  };

  // --- RENDER NODES ---

  const renderNodeContent = (node: WorkflowNodeData) => {
    // --- Input node (always complete, editable) ---
    if (node.type === 'input') {
      return (
        <div className="flex flex-col h-full relative">
          <textarea
            className="flex-1 w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm resize-none outline-none focus:border-emerald-500 transition-colors custom-scrollbar"
            placeholder="Describe your ad requirements..."
            value={node.content.text || ''}
            onChange={(e) => updateNodeContent(node.id, { text: e.target.value })}
            onWheel={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    // --- Render / Final Video node ---
    if (node.type === 'render') {
      return (
        <div className="flex flex-col h-full relative bg-gray-50 p-3">
          {!node.isComplete && !node.isProcessing && (
            <div className="flex-1 flex items-center justify-center bg-black/5 rounded-lg">
              <button
                onClick={() => runNodeProcess(node.id)}
                className="w-20 h-20 bg-[#006838] text-white rounded-full flex items-center justify-center hover:bg-[#00502b] hover:scale-105 transition-all shadow-xl"
              >
                <Play size={36} fill="currentColor" className="ml-1" />
              </button>
            </div>
          )}
          {node.isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center bg-black rounded-lg">
              <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-white/70 text-sm">Rendering Video...</span>
            </div>
          )}
          {node.isComplete && node.content.url && (
            <VideoNodeContent
              url={node.content.url}
              onRegenerate={() => runNodeProcess(node.id)}
            />
          )}
        </div>
      );
    }

    // --- All pipeline stage nodes (scenes, script, visuals, animations, tts) ---
    return (
      <div className="flex flex-col h-full relative">
        {/* Pending state — play button to accept/trigger */}
        {!node.isComplete && !node.isProcessing && (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => runNodeProcess(node.id)}
              className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:scale-110 transition-all shadow-sm border border-emerald-100"
            >
              <Play size={32} fill="currentColor" className="ml-1" />
            </button>
          </div>
        )}

        {/* Processing state — spinner */}
        {node.isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Generating...</span>
          </div>
        )}

        {/* Complete state — show the result */}
        {node.isComplete && (
          <>
            <div
              className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-10"
              onWheel={(e) => e.stopPropagation()}
            >
              <textarea
                className="w-full h-full bg-transparent resize-none text-sm outline-none text-gray-700 font-mono leading-relaxed custom-scrollbar"
                value={node.content.text || ''}
                onChange={(e) => updateNodeContent(node.id, { text: e.target.value })}
                onWheel={(e) => e.stopPropagation()}
              />
            </div>

            {/* Bottom action buttons */}
            <div className="absolute bottom-1 right-1 flex gap-2">
              {node.type === 'script' && (
                <button
                  onClick={() => toggleTTS(node.content.text || '')}
                  className="p-2 hover:bg-emerald-50 rounded-full text-emerald-600 bg-white shadow-sm border border-gray-100 transition-colors"
                  title={ttsState === 'playing' ? "Pause" : "Play TTS"}
                >
                  {ttsState === 'playing' ? <Pause size={14} fill="currentColor" /> : <Volume2 size={14} />}
                </button>
              )}
              <button
                onClick={() => runNodeProcess(node.id)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:rotate-180 transition-transform duration-500 bg-white shadow-sm border border-gray-100"
                title="Regenerate"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderInputBox = () => {
    return (
      <div className="w-full relative bg-white rounded-full shadow-lg border border-gray-200 focus-within:border-emerald-500 focus-within:shadow-xl transition-all duration-300 px-1 py-1 flex items-center">
        <div className="flex items-center h-full pl-1">
          <label className="p-2.5 text-gray-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-gray-50 flex-shrink-0 cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
              }}
            />
            <Paperclip size={20} />
          </label>
        </div>

        <div className="flex-1 flex items-center min-h-[44px] px-2 gap-2 overflow-hidden">
          {attachedFile && (
            <div className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
              <Paperclip size={12} />
              <span className="max-w-[100px] truncate">{attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="hover:text-blue-950 p-0.5 rounded-full hover:bg-blue-200/50 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {activeChip && (
            <div className="flex-shrink-0 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
              {activeChip}
              <button
                onClick={() => setActiveChip(null)}
                className="hover:text-emerald-950 p-0.5 rounded-full hover:bg-emerald-200/50 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* File Upload Indicators */}
          {uploadedDocuments.length > 0 && (
            <div className="flex-shrink-0 bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <FileText size={12} />
              <span>{uploadedDocuments.length} doc(s)</span>
            </div>
          )}
          {uploadedImages.length > 0 && (
            <div className="flex-shrink-0 bg-pink-100 text-pink-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <ImageIcon size={12} />
              <span>{uploadedImages.length} image(s)</span>
            </div>
          )}
          {uploadedLogo && (
            <div className="flex-shrink-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <ImageIcon size={12} />
              <span>Logo</span>
            </div>
          )}

          {showSettings && (
            <div className="relative top-full mt-4 right-0
  w-[400px]
  bg-white rounded-2xl shadow-xl border border-gray-100
  p-5 z-50
  max-h-[70vh] overflow-y-auto
  custom-scrollbar">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Sliders size={16} /> Configuration & Assets
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>

              {/* File Upload Section */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Upload Assets</h4>
                
                {/* Logo Upload */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Company Logo</label>
                  {uploadedLogo ? (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <ImageIcon size={16} className="text-indigo-600" />
                      <span className="text-sm text-indigo-800 flex-1 truncate">{uploadedLogo.name}</span>
                      <button onClick={removeLogo} className="p-1 hover:bg-indigo-100 rounded">
                        <X size={14} className="text-indigo-600" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all text-center">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to upload logo</span>
                    </label>
                  )}
                </div>

                {/* Product Images Upload */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Product Images</label>
                  <div className="space-y-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg border border-pink-200">
                        <ImageIcon size={16} className="text-pink-600" />
                        <span className="text-sm text-pink-800 flex-1 truncate">{img.name}</span>
                        <button onClick={() => removeImage(idx)} className="p-1 hover:bg-pink-100 rounded">
                          <X size={14} className="text-pink-600" />
                        </button>
                      </div>
                    ))}
                    <label className="block w-full p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all text-center">
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                      <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to add images</span>
                    </label>
                  </div>
                </div>

                {/* Documents Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Reference Documents (PDF, DOCX, TXT)</label>
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <FileText size={16} className="text-purple-600" />
                        <span className="text-sm text-purple-800 flex-1 truncate">{doc.name}</span>
                        <button onClick={() => removeDocument(idx)} className="p-1 hover:bg-purple-100 rounded">
                          <X size={14} className="text-purple-600" />
                        </button>
                      </div>
                    ))}
                    <label className="block w-full p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all text-center">
                      <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" multiple className="hidden" onChange={handleDocumentUpload} />
                      <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to upload documents</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Configure For</label>
                <select
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-sm font-medium text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  value={settingsContext}
                  onChange={(e) => setSettingsContext(e.target.value)}
                >
                  {QUICK_ACTIONS.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Persona</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    value={videoSettings[settingsContext].persona}
                    onChange={(e) => handleSettingChange('persona', e.target.value)}
                  >
                    <option value="professional medical narrator">Professional Medical</option>
                    <option value="friendly health narrator">Friendly Health</option>
                    <option value="compliance officer">Compliance Officer</option>
                    <option value="friendly brand narrator">Friendly Brand</option>
                    <option value="energetic brand voice">Energetic Brand</option>
                    <option value="calm and reassuring">Calm & Reassuring</option>
                    <option value="scientific and professional">Scientific & Professional</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Tone</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    value={videoSettings[settingsContext].tone}
                    onChange={(e) => handleSettingChange('tone', e.target.value)}
                  >
                    <option value="scientific and professional">Scientific & Professional</option>
                    <option value="engaging and conversational">Engaging & Conversational</option>
                    <option value="formal and precise">Formal & Precise</option>
                    <option value="clear and educational">Clear & Educational</option>
                    <option value="clear and reassuring">Clear & Reassuring</option>
                    <option value="dramatic and emotional">Dramatic & Emotional</option>
                  </select>
                </div>

                {videoSettings[settingsContext].quality !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Quality</label>
                    <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                      {['low', 'medium', 'high'].map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSettingChange('quality', q)}
                          className={`flex-1 capitalize text-xs py-1.5 rounded-md transition-all ${videoSettings[settingsContext].quality === q ? 'bg-white shadow-sm text-emerald-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {settingsContext === 'Disease awareness' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Region</label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={videoSettings[settingsContext].region || 'global'}
                      onChange={(e) => handleSettingChange('region', e.target.value)}
                    >
                      <option value="global">Global</option>
                      <option value="india">India</option>
                      <option value="africa">Africa</option>
                      <option value="europe">Europe</option>
                      <option value="asia">Asia</option>
                      <option value="north_america">North America</option>
                      <option value="south_america">South America</option>
                    </select>
                  </div>
                )}

                {(settingsContext === 'Consumer Ads' || settingsContext === 'Disease awareness' || settingsContext === 'Compliance') && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Brand Name</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={videoSettings[settingsContext].brand_name || ''}
                      onChange={(e) => handleSettingChange('brand_name', e.target.value)}
                    />
                  </div>
                )}

                {(settingsContext === 'Mechanism of action' || settingsContext === 'Social media') && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Target Audience</label>
                    <input
                      type="text"
                      placeholder="e.g. Cardiologists, Patients"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={videoSettings[settingsContext].target_audience || ''}
                      onChange={(e) => handleSettingChange('target_audience', e.target.value)}
                    />
                  </div>
                )}

                {(settingsContext === 'Clinical Ads' || settingsContext === 'Social media') && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Indication</label>
                    <input
                      type="text"
                      placeholder="e.g. Type 2 Diabetes"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={videoSettings[settingsContext].indication || ''}
                      onChange={(e) => handleSettingChange('indication', e.target.value)}
                    />
                  </div>
                )}

                {settingsContext === 'Social media' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Key Benefit</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Fast acting relief..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      value={videoSettings[settingsContext].key_benefit || ''}
                      onChange={(e) => handleSettingChange('key_benefit', e.target.value)}
                    />
                  </div>
                )}

                {settingsContext === 'Clinical Ads' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">MoA Summary</label>
                      <textarea
                        rows={2}
                        placeholder="Brief mechanism..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        value={videoSettings[settingsContext].moa_summary || ''}
                        onChange={(e) => handleSettingChange('moa_summary', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Clinical Data</label>
                      <textarea
                        rows={2}
                        placeholder="Key stats/p-values..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        value={videoSettings[settingsContext].clinical_data || ''}
                        onChange={(e) => handleSettingChange('clinical_data', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {settingsContext === 'Mechanism of action' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. Hypertension"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={videoSettings[settingsContext].condition || ''}
                      onChange={(e) => handleSettingChange('condition', e.target.value)}
                    />
                  </div>
                )}

                {settingsContext === 'Consumer Ads' && (
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm text-gray-700 font-medium">Use SadTalker (Face Anim)</label>
                    <button
                      onClick={() => handleSettingChange('integrate_sadtalker', !videoSettings[settingsContext].integrate_sadtalker)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${videoSettings[settingsContext].integrate_sadtalker ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${videoSettings[settingsContext].integrate_sadtalker ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-2 flex items-center gap-2 relative z-20">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-full transition-all ${showSettings ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50 text-gray-400'}`}
              title="Video Configuration & Assets"
            >
              <Settings size={20} />
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Ask anything or describe your video project..."
              className="flex-1 max-h-32 py-2 bg-transparent border-none outline-none text-base resize-none text-gray-800 placeholder-gray-400 custom-scrollbar self-center"
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 pr-1 h-full">
          {inputValue.trim() || activeChip ? (
            <button
              onClick={handleGenerate}
              className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all shadow-md hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          ) : (
            <button className="p-2.5 text-gray-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-gray-50 flex-shrink-0">
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const getActivePathEndIndex = () => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].isProcessing) return i - 1;
    }
    return -1;
  };

  const activePathEndIndex = getActivePathEndIndex();

  return (
    <div className="h-screen w-screen bg-[#f8fcf9] text-gray-900 font-sans overflow-hidden flex">

      <aside
        className={`bg-gradient-to-b from-[#0E3B2E] via-[#0B3327] to-[#08281F] flex flex-col transition-all duration-300 border-r border-white/5 flex-shrink-0 relative z-30 overflow-x-hidden shadow-2xl ${sidebarOpen ? 'w-72' : 'w-0 opacity-0'
          }`}
      >
        <div className="p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 select-none">
            <span className="text-lg font-black tracking-tighter text-white">
              PRISM <span className="text-[#2FAE8F]">MOTION</span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="px-4 py-2 space-y-2 flex-shrink-0">
          <button
            onClick={() => handleModeSwitch('agent')}
            className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all flex items-center gap-3 ${selectedMode === 'agent'
              ? 'bg-[#78D2AA]/10 text-[#CFF5E6] border border-[#78D2AA]/20 shadow-sm'
              : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
          >
            Agent Mode
          </button>
          <button
            onClick={() => {
              handleModeSwitch('creator');
              setCreatorAction(null);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all flex items-center gap-3 ${selectedMode === 'creator'
              ? 'bg-[#78D2AA]/10 text-[#CFF5E6] border border-[#78D2AA]/20 shadow-sm'
              : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
          >
            Creator Mode
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 relative custom-scrollbar">
          <div
            className={`transition-all duration-500 absolute inset-x-4 top-6 ${selectedMode === 'agent'
              ? 'opacity-100 translate-x-0 visible'
              : 'opacity-0 -translate-x-10 invisible pointer-events-none'
              }`}
          >
            <button onClick={handleNewChat} className="w-full flex items-center gap-3 px-4 py-3 mb-6 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-base font-medium text-white/90 transition-all duration-200 group">
              <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-[#2FAE8F]/20 transition-colors">
                <Plus size={18} className="text-white/70 group-hover:text-[#2FAE8F]" />
              </div>
              New Chat
            </button>
            <div className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-3 px-2">Recent chats</div>
            {chatSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm italic">
                <p>No recent chats</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatSessions.map(chat => (
                  <button key={chat.id} onClick={() => setCurrentSessionId(chat.id)} className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 group ${currentSessionId === chat.id ? 'bg-white/10 text-white' : 'text-white/70'}`}>
                    <span className="truncate group-hover:text-white flex-1 text-sm font-medium transition-colors">{chat.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className={`absolute top-6 left-0 w-full px-4 flex flex-col gap-3 transition-all duration-300 ${selectedMode === 'creator' ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-[600ms]'
              }`}
          >
            <div className={`text-xs font-semibold text-white/40 tracking-wider uppercase mb-1 px-1 text-left transition-opacity duration-300 ${selectedMode === 'creator' ? 'opacity-100' : 'opacity-0'}`}>
              Available workflows
            </div>
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col gap-2 w-full">
                {QUICK_ACTIONS.map((action, index) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    style={{
                      transitionDelay: getAnimationDelay(index),
                      transitionDuration: `${ANIM_DURATION}ms`,
                      transitionProperty: 'all',
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className={`w-full px-4 py-3 bg-[#E6F4EA] hover:bg-[#D1FAE5] text-[#064E3B] border border-transparent hover:border-[#34D399] rounded-xl font-medium shadow-sm text-sm text-left hover:translate-x-1 transition-all ${selectedMode === 'creator'
                      ? 'opacity-100 translate-x-0 scale-100'
                      : 'opacity-0 translate-x-[150%] scale-90'
                      }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex-shrink-0 bg-[#0E3B2E]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2FAE8F] to-[#0E3B2E] border border-white/10 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {userData.companyName ? userData.companyName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white/90 truncate">{userData.companyName || 'User'}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">
        <header className="absolute top-0 left-0 w-full flex items-center justify-between px-8 py-5 z-40 bg-transparent pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <Menu size={20} />
              </button>
            )}
            {!sidebarOpen && (
              <span className="text-xl font-black tracking-tighter text-black select-none transition-opacity duration-300">
                PRISM <span className="text-emerald-600">MOTION</span>
              </span>
            )}
          </div>
          <div className="relative pointer-events-auto">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold border border-gray-300">
                {userData.companyName ? userData.companyName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        </header>

        <div className="relative w-full h-full overflow-hidden">
          <div
            className={`absolute inset-0 flex flex-col transition-opacity duration-300 ease-in-out z-10 ${selectedMode === 'agent' ? 'opacity-100 visible delay-0' : 'opacity-0 invisible delay-[600ms]'
              }`}
          >
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(16, 160, 120, 0.22) 2px, transparent 2px)', backgroundSize: '24px 24px', opacity: 1 }} />
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,160,120,0.05)_0%,rgba(248,252,249,1)_80%)]" />

            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 z-10">
                <div className="text-center space-y-4 mb-10 px-4 max-w-4xl mx-auto flex-shrink-0">
                  <h1 className="text-5xl md:text-6xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600 tracking-tight leading-tight">
                    Hello, {userData.companyName || 'Traveler'}
                  </h1>
                  <h2 className="text-3xl md:text-4xl font-medium text-gray-400">
                    How can I help you today?
                  </h2>
                </div>
                <div className="w-full flex flex-col items-center gap-8 flex-shrink-0">
                  <div className="w-full max-w-5xl px-6">
                    {renderInputBox()}
                  </div>
                  <div className="w-full max-w-6xl px-6 flex justify-center">
                    <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar py-2 w-full justify-center">
                      {QUICK_ACTIONS.map((action, index) => (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action)}
                          style={{ transitionDelay: getAnimationDelay(index), transitionDuration: `${ANIM_DURATION}ms`, transitionProperty: 'all', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', }}
                          className={`flex-shrink-0 px-5 py-2.5 bg-[#006838] hover:bg-[#00502b] text-white rounded-full font-medium shadow-sm text-sm md:text-base whitespace-nowrap hover:-translate-y-0.5 w-max ${selectedMode === 'agent' ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-[150%] scale-90'
                            }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto h-full z-10 pt-20 pb-4 px-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6 custom-scrollbar">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0 text-emerald-700">
                          <div className="text-xs font-bold">AI</div>
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user'
                        ? 'bg-[#006838] text-white rounded-tr-none'
                        : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-none'
                        }`}>
                        {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                        {msg.isLoading && (
                          <div className="flex gap-1 items-center h-6">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                        {msg.videoUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden bg-black aspect-video relative group cursor-pointer border border-gray-200">
                            <video src={msg.videoUrl} controls className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center ml-3 mt-1 flex-shrink-0 text-white font-bold text-xs">
                          {userData.companyName ? userData.companyName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="pt-4 flex flex-col gap-4">
                  {renderInputBox()}
                  <div className="w-full flex justify-center">
                    <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar py-2 w-full justify-center">
                      {QUICK_ACTIONS.map((action, index) => (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action)}
                          style={{ transitionDelay: getAnimationDelay(index), transitionDuration: `${ANIM_DURATION}ms`, transitionProperty: 'all', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', }}
                          className={`flex-shrink-0 px-5 py-2.5 bg-[#006838] hover:bg-[#00502b] text-white rounded-full font-medium shadow-sm text-sm md:text-base whitespace-nowrap hover:-translate-y-0.5 w-max ${selectedMode === 'agent' ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-[150%] scale-90'
                            }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className={`absolute inset-0 z-0 bg-white transition-opacity duration-300 ease-in-out ${showCanvas ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            <div
              className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
              style={{
                backgroundColor: 'white',
                backgroundImage: 'radial-gradient(rgba(16, 160, 120, 0.55) 2px, transparent 2px)',
                backgroundSize: `${30 * scale}px ${30 * scale}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                opacity: isGlobalProcessing ? 0.5 : 1,
                maskImage: 'radial-gradient(circle at center, black 30%, rgba(0,0,0,0.2) 100%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 30%, rgba(0,0,0,0.2) 100%)'
              }}
            />

            {enlargedImage && (
              <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-10 cursor-pointer" onClick={() => setEnlargedImage(null)}>
                <img src={enlargedImage} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="Enlarged" />
              </div>
            )}

            <div
              className="absolute top-0 left-0 w-full h-full origin-top-left"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
            >
              {creatorAction && (
                <div className={`absolute -top-24 left-1/2 -translate-x-1/2 min-w-[300px] bg-white/90 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border border-emerald-100 z-0 text-center transition-opacity duration-300 ${isGlobalProcessing ? 'opacity-50' : 'opacity-100'}`}>
                  <h2 className="text-2xl font-bold text-emerald-900 whitespace-nowrap">{creatorAction}</h2>
                </div>
              )}

              {creatorAction && (
                <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible z-0">
                  <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {nodes.slice(0, -1).map((node, i) => {
                    const nextNode = nodes[i + 1];
                    const startX = node.x + node.width;
                    const startY = node.y + node.height / 2;
                    const endX = nextNode.x;
                    const endY = nextNode.y + nextNode.height / 2;

                    const controlPoint1X = startX + (endX - startX) * 0.5;
                    const controlPoint1Y = startY;
                    const controlPoint2X = endX - (endX - startX) * 0.5;
                    const controlPoint2Y = endY;

                    const isPathActive = i <= activePathEndIndex;

                    return (
                      <g key={`conn-${i}`}>
                        <path
                          d={`M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`}
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d={`M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`}
                          fill="none"
                          stroke={isPathActive ? "url(#neonGradient)" : "#10b981"}
                          strokeWidth={isPathActive ? "4" : "0"}
                          className={isPathActive ? "animate-[dash_1s_linear_infinite]" : "opacity-0"}
                          strokeDasharray="10, 10"
                          style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' }}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              <div className={isGlobalProcessing ? 'pointer-events-none' : ''}>
                {creatorAction && nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`workflow-node absolute bg-white rounded-2xl border-2 border-emerald-500/20 shadow-xl flex flex-col overflow-hidden transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl z-10`}
                    style={{
                      left: node.x,
                      top: node.y,
                      width: node.width,
                      height: node.height,
                    }}
                  >
                    <div
                      className="bg-emerald-50/50 border-b border-emerald-100 px-4 py-2 cursor-grab active:cursor-grabbing flex justify-between items-center select-none"
                      onMouseDown={(e) => startDragNode(e, node.id, node.x, node.y)}
                    >
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                        {node.type === 'input' && <FileText size={14} />}
                        {node.type === 'scenes' && <Film size={14} />}
                        {node.type === 'script' && <FileText size={14} />}
                        {node.type === 'visuals' && <ImageIcon size={14} />}
                        {node.type === 'animations' && <Wand2 size={14} />}
                        {node.type === 'tts' && <Volume2 size={14} />}
                        {node.type === 'render' && <Video size={14} />}
                        {node.title}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-1">
                        {node.isProcessing && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            PROCESSING
                          </div>
                        )}
                        {node.isComplete && !node.isProcessing && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            COMPLETE
                          </div>
                        )}
                        {!node.isProcessing && !node.isComplete && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-semibold">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            PENDING
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-3 overflow-hidden relative">
                      {renderNodeContent(node)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!creatorAction && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-center">
                <div className="w-[400px] h-[240px] border-2 border-dashed border-emerald-300/50 bg-emerald-50/20 rounded-[32px] flex flex-col items-center justify-center backdrop-blur-[1px] mb-4">
                  <span className="text-emerald-500 font-bold text-2xl tracking-tight">Select a Workflow</span>
                </div>
              </div>
            )}

            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -40;
                }
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 0px;
                display: none;
              }
              .custom-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className={`
            flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border
            ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}>
            {toast.type === 'success' && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
            {toast.type === 'error' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
            {toast.type === 'info' && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MainApp;