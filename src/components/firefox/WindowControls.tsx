interface WindowControlsProps {
  platform?: 'macOS' | 'windows'
  onClose?: () => void
}

export function WindowControls({ platform = 'macOS', onClose }: WindowControlsProps) {
  if (platform === 'macOS') {
    return (
      <div className="flex items-center gap-2 pl-[13px] pr-8">
        <div className="flex gap-2">
          <button 
            className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] hover:bg-[#FF4136] transition-colors cursor-pointer" 
            onClick={onClose}
            title="Close window"
          />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
        </div>
      </div>
    )
  }
  
  return null
}