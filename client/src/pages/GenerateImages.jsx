import React, { useState } from 'react'
import { Image, Sparkles } from 'lucide-react' 
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL; 

const GenerateImages = () => {

  const imageStyles = [
    'Realistic',
    'Ghibli style',
    'Anime style',
    'Cartoon style',
    'Fantasy style',
    '3D style',
    'Portrait style',
  ]

  const [selectedStyle, setSelectedStyle] = useState(imageStyles[0])
  const [input, setInput] = useState('')
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  
  const {getToken} = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try{
      setLoading(true)

      const prompt = `generate an image of ${input} in the style ${selectedStyle}`

      const {data} = await axios.post('/api/ai/generate-image', 
      {prompt, publish},{headers: {Authorization: `Bearer ${await getToken()}`}})

      if(data.success) {
        setContent(data.content)
      } else{
        toast.error(data.message);
      }
    } catch (error){
       toast.error(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* FORM */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        {/* Prompt */}
        <p className="mt-6 text-sm font-medium">Describe your image</p>
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to see in the image..."
          required
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md"
        />

        {/* Style */}
        <p className="mt-4 text-sm font-medium">Style</p>
        <div className="mt-3 flex gap-3 flex-wrap">
          {imageStyles.map((style) => (
            <span
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer transition
                ${
                  selectedStyle === style
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : 'text-gray-500 border-gray-300 hover:bg-gray-100'
                }`}
            >
              {style}
            </span>
          ))}
        </div>

        {/* Publish Toggle */}
        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>
            <span
              className="
                absolute left-1 top-1 w-3 h-3 bg-white rounded-full
                transition-transform peer-checked:translate-x-4
              "
            ></span>
          </label>
          <p className="text-sm">Make this image public</p>
        </div>

        {/* Submit */}
        <button disabled={loading} type="submit"
          className="
          mt-6 w-full flex items-center justify-center gap-2
          bg-gradient-to-r from-[#00AD25] to-[#04FF50]
          text-white py-2 px-4 rounded-lg text-sm
          hover:opacity-90 cursor-pointer transition">
            {loading ? <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin" ></span> : <Image className="w-5 h-5" /> }
          
          Generate Image
        </button>
      </form>

      {/* RESULT PANEL */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">Generated Image</h1>
        </div>
        {
          !content ? (
            <div className="flex-1 flex items-center justify-center">
          <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
            <Image className="w-12 h-12" />
            <p className="italic">Your generated image will appear here.</p>
          </div>
        </div>
          ) : (
            <div className='mt-3 h-full'>
              <img src={content} alt="image" className='w-full h-full'/>
            </div>
          )
        }
        
      </div>

    </div>
  )
}

export default GenerateImages
