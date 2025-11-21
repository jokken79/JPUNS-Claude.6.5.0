export interface PresetCombination {
  id: string;
  name: string;
  description: string;
  templateId: string;
  themeName: string;
  category: string;
  tags: string[];
  preview: {
    gradient: string;
    emoji: string;
  };
}

export const presetCombinations: PresetCombination[] = [
  {
    id: 'professional-corporate',
    name: 'Professional Corporate',
    description: 'Perfect for HR and corporate environments with refined elegance and clarity',
    templateId: 'executive-elegance',
    themeName: 'uns-kikaku',
    category: 'corporate',
    tags: ['professional', 'corporate', 'hr', 'business'],
    preview: {
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
      emoji: '🏢',
    },
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    description: 'Bold and vibrant design for creative agencies and studios',
    templateId: 'tokyo-neon-grid',
    themeName: 'vibrant-coral',
    category: 'creative',
    tags: ['creative', 'agency', 'design', 'bold'],
    preview: {
      gradient: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
      emoji: '🎨',
    },
  },
  {
    id: 'minimal-startup',
    name: 'Minimal Startup',
    description: 'Clean and modern design for tech startups and SaaS products',
    templateId: 'nordic-minimal',
    themeName: 'monochrome',
    category: 'startup',
    tags: ['minimal', 'startup', 'saas', 'tech'],
    preview: {
      gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      emoji: '⚡',
    },
  },
  {
    id: 'luxury-experience',
    name: 'Luxury Experience',
    description: 'Premium design with golden accents for high-end brands',
    templateId: 'midnight-sonata',
    themeName: 'espresso',
    category: 'luxury',
    tags: ['luxury', 'premium', 'high-end', 'elegant'],
    preview: {
      gradient: 'linear-gradient(135deg, #4C1D95 0%, #FACC15 100%)',
      emoji: '👑',
    },
  },
  {
    id: 'tech-futuristic',
    name: 'Tech Futuristic',
    description: 'Cutting-edge design with mesh gradients for AI and tech products',
    templateId: 'gradient-mesh-futurism',
    themeName: 'royal-purple',
    category: 'tech',
    tags: ['futuristic', 'ai', 'tech', 'modern'],
    preview: {
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
      emoji: '🚀',
    },
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    description: 'Relaxing blue tones perfect for productivity and wellness apps',
    templateId: 'atlantic-glass',
    themeName: 'ocean-blue',
    category: 'wellness',
    tags: ['calm', 'wellness', 'productivity', 'blue'],
    preview: {
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
      emoji: '🌊',
    },
  },
  {
    id: 'nature-zen',
    name: 'Nature Zen',
    description: 'Peaceful green design inspired by nature and tranquility',
    templateId: 'zen-garden',
    themeName: 'forest-green',
    category: 'wellness',
    tags: ['nature', 'zen', 'peaceful', 'green'],
    preview: {
      gradient: 'linear-gradient(135deg, #0F766E 0%, #10B981 100%)',
      emoji: '🌿',
    },
  },
  {
    id: 'sunset-warmth',
    name: 'Sunset Warmth',
    description: 'Warm and inviting design with sunset color palette',
    templateId: 'desert-mirage',
    themeName: 'sunset',
    category: 'creative',
    tags: ['warm', 'sunset', 'inviting', 'orange'],
    preview: {
      gradient: 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
      emoji: '🌅',
    },
  },
  {
    id: 'tropical-energy',
    name: 'Tropical Energy',
    description: 'Vibrant Caribbean-inspired design full of energy',
    templateId: 'caribbean-aurora',
    themeName: 'mint-green',
    category: 'creative',
    tags: ['tropical', 'energy', 'vibrant', 'caribbean'],
    preview: {
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #F97316 100%)',
      emoji: '🏝️',
    },
  },
  {
    id: 'next-gen-startup',
    name: 'Next-Gen Startup',
    description: 'Modern startup template with velocity and momentum',
    templateId: 'nextjstemplates-velocity',
    themeName: 'industrial',
    category: 'startup',
    tags: ['startup', 'velocity', 'modern', 'purple'],
    preview: {
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
      emoji: '💼',
    },
  },
  {
    id: 'landing-pro',
    name: 'Landing Pro',
    description: 'Professional landing page design for SaaS and B2B',
    templateId: 'themefisher-nexus',
    themeName: 'default-light',
    category: 'landing',
    tags: ['landing', 'saas', 'b2b', 'professional'],
    preview: {
      gradient: 'linear-gradient(135deg, #2563EB 0%, #F59E0B 100%)',
      emoji: '📄',
    },
  },
  {
    id: 'creative-aurora',
    name: 'Creative Aurora',
    description: 'Creative studio template with aurora effects and gradients',
    templateId: 'nextjstemplates-lumina',
    themeName: 'vibrant-coral',
    category: 'creative',
    tags: ['creative', 'aurora', 'studio', 'design'],
    preview: {
      gradient: 'linear-gradient(135deg, #6366F1 0%, #F472B6 100%)',
      emoji: '✨',
    },
  },
  {
    id: 'corporate-venture',
    name: 'Corporate Venture',
    description: 'Dynamic B2B corporate design with conversion focus',
    templateId: 'themefisher-venture',
    themeName: 'uns-kikaku',
    category: 'corporate',
    tags: ['corporate', 'b2b', 'venture', 'professional'],
    preview: {
      gradient: 'linear-gradient(135deg, #1D4ED8 0%, #F97316 100%)',
      emoji: '🏛️',
    },
  },
  {
    id: 'apple-minimal',
    name: 'Apple Minimal',
    description: 'Clean Apple-inspired design with Bento grid layouts',
    templateId: 'bento-grid-minimal',
    themeName: 'default-light',
    category: 'minimal',
    tags: ['minimal', 'apple', 'clean', 'grid'],
    preview: {
      gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 100%)',
      emoji: '🍎',
    },
  },
  {
    id: 'soft-comfort',
    name: 'Soft Comfort',
    description: 'Comfortable neumorphism design with soft shadows',
    templateId: 'soft-ui-neumorphism',
    themeName: 'default-light',
    category: 'minimal',
    tags: ['neumorphism', 'soft', 'comfortable', 'subtle'],
    preview: {
      gradient: 'linear-gradient(135deg, #E0E5EC 0%, #D1D9E6 100%)',
      emoji: '☁️',
    },
  },
  {
    id: 'brutal-statement',
    name: 'Brutal Statement',
    description: 'Bold neo-brutalism design that makes a statement',
    templateId: 'neo-brutalism',
    themeName: 'monochrome',
    category: 'experimental',
    tags: ['brutalism', 'bold', 'statement', 'experimental'],
    preview: {
      gradient: 'linear-gradient(135deg, #FFEE00 0%, #FF3366 50%, #00FF94 100%)',
      emoji: '⚡',
    },
  },
  {
    id: 'holographic-future',
    name: 'Holographic Future',
    description: 'Futuristic holographic design with rainbow gradients',
    templateId: 'holographic-iridescent',
    themeName: 'default-dark',
    category: 'futuristic',
    tags: ['holographic', 'future', 'rainbow', 'iridescent'],
    preview: {
      gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C371F4 25%, #4FACFE 50%, #FFC371 75%, #FF6B9D 100%)',
      emoji: '🌈',
    },
  },
  {
    id: 'dark-professional',
    name: 'Dark Professional',
    description: 'Professional dark theme for modern applications',
    templateId: 'executive-elegance',
    themeName: 'default-dark',
    category: 'corporate',
    tags: ['dark', 'professional', 'modern', 'corporate'],
    preview: {
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1E40AF 100%)',
      emoji: '🌑',
    },
  },
];

export function getPresetCombinationById(id: string): PresetCombination | undefined {
  return presetCombinations.find(p => p.id === id);
}

export function getPresetCombinationsByCategory(category: string): PresetCombination[] {
  return presetCombinations.filter(p => p.category === category);
}

export function getPresetCombinationsByTag(tag: string): PresetCombination[] {
  return presetCombinations.filter(p => p.tags.includes(tag));
}

export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🎯' },
  { id: 'corporate', label: 'Corporate', emoji: '🏢' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'startup', label: 'Startup', emoji: '⚡' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'luxury', label: 'Luxury', emoji: '👑' },
  { id: 'minimal', label: 'Minimal', emoji: '⚪' },
  { id: 'wellness', label: 'Wellness', emoji: '🌿' },
  { id: 'futuristic', label: 'Futuristic', emoji: '🚀' },
  { id: 'experimental', label: 'Experimental', emoji: '🧪' },
];
