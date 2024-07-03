import { useState } from 'react';
import './styles.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css'


function App() {
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState(
    [

    ]
  );
  const [isGenerating, setIsGenerating] = useState(false);

  async function doPrompt(text) {
    if (prompt.trim() === '') return;

    let newChat;
    setChat((old) => {
      newChat = old.map(i => i);
      // console.log(newChat);
      newChat.push({ text: prompt, from: 'user' });
      return newChat;
    })

    const session = await window.ai.createTextSession();
    setIsGenerating(true);
    let response = await session.promptStreaming(text);
    let reader = await response.getReader();
    let pointer;
    let textUpdate;
    // console.log('---');
    do {
      pointer = await reader.read();
      // console.log(pointer);

      const updateChat = async (old) => {
        let newChat;
        // console.log(old)
        textUpdate = await pointer;
        if (!textUpdate.done) {
          newChat = [...old];
          // console.log(newChat);
          if (newChat.length > 0 && newChat[newChat.length - 1]?.from !== 'user') {
            newChat[newChat.length - 1].text = textUpdate.value;
          } else {
            newChat.push({ text: textUpdate.value, from: 'ai' });
          }
          return newChat;
        }
        // console.log('returning old');
        return false;
      }
      newChat = await updateChat(newChat)
      if (newChat)
        setChat(newChat);
    } while (!pointer['done']);
    setIsGenerating(false);
    session.destroy();
  }

  // console.log(chat)
  const renderChat = () => chat.map((i, index) => i.from === 'user' ?
  <p className='bg-sky-900 text-white self-end min-w-12 max-w-[45%] p-2 rounded' key={index}><ReactMarkdown children={i.text} remarkPlugins={[remarkGfm]} /></p> :
  <p className='bg-teal-900 text-white self-start min-w-12 max-w-[45%] p-2 rounded' key={index}><ReactMarkdown children={i.text} remarkPlugins={[remarkGfm]} /></p>
  )

  return (
    <>
      <main className='w-screen h-screen p-2 bg-neutral-800 flex flex-col gap-2'>
        <div className='bg-neutral-900 rounded mb-16 flex flex-col gap-2 p-2 h-[85%] overflow-y-auto w-full'>

          {renderChat()}
          {isGenerating && <p className='text-white text-xs'>Generating...</p>}
        </div>
      </main>
      <div className='absolute bottom-0 p-1 w-full flex'>
        <textarea type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
          className='flex-grow rounded bg-neutral-900 text-slate-200 p-1' placeholder='Ask something...' />
        <button onClick={async () => doPrompt(prompt)}
          className='w-12 text-center text-white rounded border-2 ml-1'>send</button>
      </div>
    </>
  )

}

export default App
