
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

      <main>
        <section className="action-panel">
          <form action={addTicker} id="ticker-input-form">
            <label htmlFor="ticker-input"> Add up to 3 stock tickers below to get a super accurate stock predictions report👇 </label>
            <div className="form-input-control">
              <input type="text" id="ticker-input" name='ticker' placeholder="MSFT" />
              <button 
                className="add-ticker-btn"
              >+</button>
            </div>
          </form>
          <p className="ticker-choice-display">
            {tickers.join(', ')}
          </p>
          <button 
            className="generate-report-btn" 
            type="button"
            onClick={getStockData} 
            disabled={tickers.length > 1 ? false : true }
          > Generate Report
          </button>
          <p className="tag-line">Always correct 15% of the time!</p>
        </section>
        <section className="loading-panel">
          <img src="images/loader.svg" alt="loading" />
          <div id="api-message">Querying Stocks API...</div>
        </section>
        {renderReport && 
          <section className="output-panel">
            <h2>Your Report 😜</h2>
            <p>{renderReport}</p>
          </section>
        }
      </main>
  )
}

export default App
