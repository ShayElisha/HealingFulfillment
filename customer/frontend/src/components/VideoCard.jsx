import { useState } from 'react'
import { getVideoEmbedUrl, getVideoThumbnail } from '../utils/videoUtils'
import Card from './Card'

function VideoCard({ video, delay = 0 }) {
  const embedUrl = getVideoEmbedUrl(video.url)
  const thumbnail = getVideoThumbnail(video.url)
  const [showEmbed, setShowEmbed] = useState(false)

  return (
    <Card>
      <div className="mb-4">
        {embedUrl && showEmbed ? (
          <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden mb-3">
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div 
            className="aspect-video bg-neutral-100 rounded-lg overflow-hidden mb-3 relative cursor-pointer group"
            onClick={() => embedUrl ? setShowEmbed(true) : window.open(video.url, '_blank')}
          >
            {thumbnail ? (
              <>
                <img
                  src={thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl text-primary-600 ml-1">▶</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl text-primary-500">▶</span>
              </div>
            )}
          </div>
        )}
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-sm text-neutral-600 mb-3">
            {video.description}
          </p>
        )}
      </div>
      {!showEmbed && (
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full text-center"
        >
          {embedUrl ? 'הפעל סרטון' : 'צפה בסרטון'}
        </a>
      )}
    </Card>
  )
}

export default VideoCard

