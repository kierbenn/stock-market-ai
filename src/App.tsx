
import { useEffect, useRef, useState } from 'react'
import OpenAI from 'openai'
import { dates } from './utils/dates'
import './App.css'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY
const massiveApiKey = import.meta.env.VITE_MASSIVE_API_KEY

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
})


function App() {

  const [renderReport, setRenderReport] = useState('')
  const [tickers, setTickers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const effectRan = useRef(false)

  useEffect(() => {
    // Only run once
    if (effectRan.current) return;
    effectRan.current = true;    
  }, [])

  const addTicker = (formData: FormData) => {
    // get ticker from form and set to uppercase
    const ticker = formData.get("ticker")?.toString().toUpperCase()
    // add to the array of tickers
    if (!ticker) return
    setTickers(prev => [...prev, ticker])
    //console.log(tickers)
  }

  const getStockData = async () => {
    // API call for each ticker
    try {
      const stockData = await Promise.all(tickers.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${massiveApiKey}`
        const response = await fetch(url)
        const data = await response.text()
        const status = await response.status
        if (status === 200) {
          // creating report
          console.log(data)
          setLoading(true)
          return data
        } else {
          // error
          console.error('could get stock data')
        }
      }))
      // join stockData as text to send to AI
      getAiResponse(stockData.join(''))
    } catch (err) {
      console.error(err)
    }
  }

  async function getAiResponse(data: string) {
    
    try {
        const response = await openai.responses.create({
          model: "gpt-5-nano",
          input: [
            {
              role: 'system',
              content: 'You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stocks performance and recommending whether to buy, hold or sell.'
            }, {
              role: 'user',
              content: data
            }
          ]
        })
        console.log(response);
        setRenderReport(response.output_text)
      } catch (error) {
        console.error(error)
    }
  } 

  return (

      <main className='w-[36rem] pt-8'>
        <section className="flex flex-col gap-4">
          <h1>Stock recommendations</h1>
          <form action={addTicker} id="ticker-input-form">
            <p className='pb-6'> Add up to 3 stock tickers below<br></br>to get a super accurate stock predictions report👇 </p>
            <div className="form-input-control">
              <input 
                type="text" 
                id="ticker-input" 
                name='ticker' 
                placeholder="MSFT"
                className='p-[0.6em] border border-1 border-orange-500 rounded-l-md' 
              />
              <button 
                className="bg-orange-500 rounded-none rounded-r-md"
              >+</button>
            </div>
          </form>
          <p className="ticker-choice-display">
            {tickers.join(', ')}
          </p>
          <button 
            className="bg-green-500 mx-auto flex" 
            type="button"
            onClick={getStockData} 
            disabled={tickers.length > 1 ? false : true }
          > 
          {loading && !renderReport && <svg className="mr-3 -ml-1 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          Generate Report
          </button>
          {!renderReport && <p className="tag-line">Always correct 15% of the time!</p>}
        </section>
       
        {renderReport && 
          <section className="mt-6">
            <fieldset className="border border-gray-300 p-4 rounded-md">
              <legend className='text-lg font-semibold px-2'><h2>Your Report 😜</h2></legend>
              <p>{renderReport}</p>
            </fieldset>
          </section>
        }
      </main>
  )
}

export default App
