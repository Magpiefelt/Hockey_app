<template>
  <component :is="iconComponent" :class="iconClasses" v-bind="$attrs" />
</template>

<script setup lang="ts">
import {
  Music,
  Zap,
  Sparkles,
  Mic,
  Clock,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Users,
  Mail,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
} from 'lucide-vue-next'

interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const iconMap: Record<string, any> = {
  music: Music,
  zap: Zap,
  sparkles: Sparkles,
  mic: Mic,
  clock: Clock,
  'trending-up': TrendingUp,
  'check-circle': CheckCircle,
  'dollar-sign': DollarSign,
  users: Users,
  mail: Mail,
  'file-text': FileText,
  calendar: Calendar,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  x: X,
  menu: Menu,
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  edit: Edit,
  trash: Trash2,
  plus: Plus,
  minus: Minus,
  check: Check,
  'alert-circle': AlertCircle,
  info: Info,
}

const iconComponent = computed(() => {
  return iconMap[props.name] || Music
})

const iconClasses = computed(() => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }
  
  const colorClass = props.color ? `text-${props.color}` : ''
  
  return [sizes[props.size], colorClass].filter(Boolean).join(' ')
})
</script>

