import { Input } from '@/components/ui/input'
import CopyButton from './CopyButton'
import { Radio, Key, Monitor } from 'lucide-react'

interface RtmpFieldsProps {
  ingestUrl?: string
  rtmpKey?: string
  className?: string
}

export default function RtmpFields({ ingestUrl, rtmpKey, className = '' }: RtmpFieldsProps) {
  if (!ingestUrl && !rtmpKey) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8 text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Radio className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm">Stream details will appear here after creation</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Stream Details</h3>
          <p className="text-sm text-muted-foreground">
            Use these details in your streaming software
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            RTMP Ingest URL
          </label>
          <div className="flex gap-2">
            <Input
              value={ingestUrl || 'Not set'}
              readOnly
              className="font-mono text-xs bg-muted/50"
              placeholder="rtmp://..."
            />
            {ingestUrl && <CopyButton value={ingestUrl} label="Copy" />}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            Stream Key
          </label>
          <div className="flex gap-2">
            <Input
              value={rtmpKey || 'Not set'}
              readOnly
              className="font-mono text-xs bg-muted/50"
              placeholder="sk_..."
            />
            {rtmpKey && <CopyButton value={rtmpKey} label="Copy" />}
          </div>
        </div>
      </div>

      {/* OBS Quick Setup Card */}
      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Quick Setup with OBS
        </h4>
        <ol className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary/20 text-primary text-xs rounded-full flex items-center justify-center font-medium">
              1
            </span>
            <span>Copy the RTMP Ingest URL above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary/20 text-primary text-xs rounded-full flex items-center justify-center font-medium">
              2
            </span>
            <span>Copy the Stream Key above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary/20 text-primary text-xs rounded-full flex items-center justify-center font-medium">
              3
            </span>
            <span>In OBS: Settings → Stream → Service: Custom</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary/20 text-primary text-xs rounded-full flex items-center justify-center font-medium">
              4
            </span>
            <span>Paste the URL and key, then click &quot;Start Streaming&quot;</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
