interface WindowControlsProps {
  platform?: 'macOS' | 'windows'
}

export function WindowControls({ platform = 'macOS' }: WindowControlsProps) {
  if (platform === 'macOS') {
    return (
      <div className="flex items-center gap-2 pl-[13px] pr-8">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
        </div>
      </div>
    )
  }
  
  return null
}