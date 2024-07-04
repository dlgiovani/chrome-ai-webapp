import { useEffect, useState, useRef } from 'react';
import './styles.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css'

async function createSession() {
  try {
    // const s = await window.ai.createTextSession({ temperature: 1.2, topK: 10 });
    const s = await window.ai.createTextSession();
    return s;
  } catch (error) {
    console.error('Failed to create session:', error);
    return false;
  }
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [session, setSession] = useState(null);
  
  
  const responseRef = useRef(null);
  const readerRef = useRef(null);
  
  async function initSession() {
    let s = await createSession();
    setSession(s);
  }
  useEffect(() => {
    initSession();

    return () => {
      if (readerRef.current) {
        readerRef.current.releaseLock();
      }
      if (responseRef.current) {
        responseRef.current.cancel();
      }
    };
  }, []);

  async function doPrompt(text) {
    if (!session) return;
    if (prompt.trim() === '') return;
    setPrompt('');

    if (isGenerating) {
      await readerRef.current.releaseLock();
      await responseRef.current.cancel();
    }

    let newChat;
    setChat((old) => {
      newChat = old.map(i => i);
      // console.log(newChat);
      newChat.push({ text: prompt, from: 'user' });
      return newChat;
    })

    let mappedChat = `
    ${chat.map(i => i.from === 'user' ? `\n${i.text}` : `\n${i.text}\n`).join('\n')}
    `;

    if ((mappedChat.length / 4) > (1024 + 17 - text.length)) {
      console.log(mappedChat.length)
      let removeSize = (mappedChat.length / 4) - (1024 + 17) + text.length;
      mappedChat = mappedChat.substring(removeSize);
    }
    let promptText = chat.length > 0 ? 
`${mappedChat} <ctrl23>
${text}` : text;

    console.log(promptText);
    responseRef.current = await session.promptStreaming(promptText);

    setIsGenerating(true);
    readerRef.current = await responseRef.current.getReader();
    let pointer;
    let textUpdate;
    // console.log('---');
    do {
      if (!responseRef.current.locked) break;
      try {
        pointer = await readerRef.current.read();
      } catch {
        setIsGenerating(false);
        setChat((old) => [...old, { from: 'ai', text: 'Sorry, I was unable to provide an answer.' }]);
        setSession((old) => {
          old.destroy();
        })
        setChat((old) => old.slice(0, -1));
        initSession();
        return;
      }

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
  }

  const renderChat = () => chat.map((i, index) => i.from === 'user' ?
    <div className='bg-sky-900 text-white self-end min-w-12 max-w-[80%] lg:max-w-[800px] p-2 rounded' key={index}><ReactMarkdown remarkPlugins={[remarkGfm]}>{i.text}</ReactMarkdown></div> :
    <div className='bg-teal-900 text-white self-start min-w-12 max-w-[80%] lg:max-w-[800px] p-2 rounded' key={index}><ReactMarkdown remarkPlugins={[remarkGfm]}>{i.text}</ReactMarkdown></div>
  )

  const notSupportedPanel = <section className='absolute flex justify-center items-center w-screen h-screen overflow-hidden backdrop-blur-sm z-50'>
    <div className='bg-neutral-700 rounded text-white w-84 flex flex-col gap-4 max-w-[80%] h-[90%] p-12 overflow-y-auto'>
      <h1 className='text-2xl font-bold text-center'>Chrome AI chatbot Proof of Concept</h1>
      <a href='https://dlgiovani.github.io' target='_blank' className='underline text-center'>by Giovani</a>
      <div>
        <h2 className='text-xl font-bold text-red-400'>Not available in this browser yet</h2>
        <h3 className='text-lg font-semibold text-red-300'>Please follow instructions below to use it.</h3>
        <p className='font-thin'>(this is an experimental feature in Chrome, and available only in more advanced versions.)</p>
      </div>
      <p>This AI access an offline API provided locally by Chrome versions 127 or above.</p>
      <div className='flex flex-col gap-1 [&>a]:underline [&>a]:ml-4'>
        <p>
          To access this API, make sure you are using a version of Chrome that is compatible.
          If not, you can try the following options:
        </p>
        <a href="https://www.google.com/chrome/canary/" target='_blank'>canary (nightly builds)</a>
        <a href="https://www.google.com/chrome/dev/" target='_blank'>dev (for devs)</a>
        <a href="https://www.google.com/chrome/beta/" target='_blank'>beta (probably not working as of July 03 of 2024)</a>
      </div>

      <p>
        Once you download one of them, go to <strong>chrome://flags</strong> (write this on the url bar) and set:<br></br>
        <strong className='ml-4'>Enables optimization guide on device</strong> to <i>Enabled BypassPerfRequirements</i>;<br></br>
        <strong className='ml-4'>Prompt API for Gemini Nano</strong> to <i>Enabled</i>
      </p>

      <p>After that, relaunch Chrome. Then open it again and go to <strong>chrome://components</strong></p>
      <p>
        There you should see a component called <strong>Optimization Guide On Device Model</strong>.
        Download it. (around 1.5 gigabytes, take care)
      </p>

      <p>After that, relaunch chrome and, if it`s all correct, this message will disappear so you can use the AI.</p>
    </div>
  </section>

  return (
    <>
      {!session && notSupportedPanel}
      <main className='w-screen h-screen p-2 bg-neutral-800 flex flex-col gap-2'>
        <div className='bg-neutral-900 rounded mb-16 flex flex-col gap-2 p-2 h-[85%] overflow-y-auto w-full'>

          {renderChat()}
          {isGenerating && <p className='text-white text-xs'>Generating...</p>}
        </div>
      </main>
      <div className='absolute bottom-0 p-1 w-full flex flex-col'>
        <div className='flex'>
          <textarea type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
            className='flex-grow rounded bg-neutral-900 text-slate-200 p-1' placeholder='Ask something...' />
          <button onClick={async () => doPrompt(prompt)}
            className='w-12 text-center text-white rounded bg-neutral-950 ml-1'>send</button>
        </div>
        <p className='text-white text-center text-xs mb-1'>Local Chrome AI POC by <a href="https://dlgiovani.github.io" target='_blank' className='underline'>Giovani</a>, based on Gemini Nano.</p>
      </div>
    </>
  )

}

export default App
