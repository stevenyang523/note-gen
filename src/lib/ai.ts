import { toast } from "@/hooks/use-toast";
import { Store } from "@tauri-apps/plugin-store";
import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";

/**
 * 获取当前的prompt内容
 */
async function getPromptContent(): Promise<string> {
  const store = await Store.load('store.json')
  const currentPromptId = await store.get<string>('currentPromptId')
  let promptContent = ''
  
  if (currentPromptId) {
    const promptList = await store.get<Array<{id: string, content: string}>>('promptList')
    if (promptList) {
      const currentPrompt = promptList.find(prompt => prompt.id === currentPromptId)
      if (currentPrompt && currentPrompt.content) {
        promptContent = currentPrompt.content
      }
    }
  }
  
  return promptContent
}

/**
 * 创建OpenAI客户端，适用于所有AI类型
 */
async function createOpenAIClient() {
  const store = await Store.load('store.json')
  const baseURL = await store.get<string>('baseURL')
  const apiKey = await store.get<string>('apiKey')
  const proxyUrl = await store.get<string>('proxy')
  
  // 创建OpenAI客户端
  return new OpenAI({
    apiKey: apiKey || '',
    baseURL: baseURL,
    dangerouslyAllowBrowser: true,
    ...(proxyUrl ? { httpAgent: proxyUrl } : {})
  })
}

// 创建Google Gemini客户端
async function createGeminiClient() {
  const store = await Store.load('store.json')
  const apiKey = await store.get<string>('apiKey')
  
  // 创建Gemini客户端
  return new GoogleGenAI({apiKey: apiKey || ''});
}

/**
 * 非流式方式获取AI结果
 */
export async function fetchAi(text: string): Promise<string> {
  try {
    const store = await Store.load('store.json')
    const baseURL = await store.get<string>('baseURL')
    const model = await store.get<string>('model') || 'gpt-3.5-turbo'
    const aiType = await store.get<string>('aiType') || 'openai'
    const temperature = await store.get<number>('temperature') || 0.7
    const topP = await store.get<number>('topP') || 1
    
    if (!baseURL) {
      toast({
        title: 'AI 错误',
        description: '请先设置 AI 地址',
        variant: 'destructive',
      })
      return ''
    }
    
    // 获取prompt内容
    const promptContent = await getPromptContent()
    
    // 创建 OpenAI 客户端
    const openai = await createOpenAIClient()
    
    // 根据不同AI类型构建请求
    if (aiType === 'gemini') {
      // Gemini API请求使用@google/genai
      const finalText = promptContent ? `${promptContent}\n\n${text}` : text
      
      // 创建Gemini客户端
      const genAI = await createGeminiClient()
      
      const result = await genAI.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: finalText }]
        },
        temperature: temperature,
        topP: topP
      })
      
      return result.text || ''
    } else if (aiType === 'ollama') {
      // Ollama API请求
      const messages = []
      
      if (promptContent) {
        messages.push({
          role: 'system' as const,
          content: promptContent
        })
      }
      
      messages.push({
        role: 'user' as const,
        content: text
      })
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        top_p: topP,
      })
      
      return completion.choices[0].message.content || ''
    } else {
      // OpenAI 请求
      const messages = []
      
      if (promptContent) {
        messages.push({
          role: 'system' as const,
          content: promptContent
        })
      }
      
      messages.push({
        role: 'user' as const,
        content: text
      })
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        top_p: topP,
      })
      
      return completion.choices[0].message.content || ''
    }
  } catch (error) {
    toast({
      title: 'AI 错误',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
    return `请求失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 流式方式获取AI结果
 * @param text 请求文本
 * @param onUpdate 每次收到流式内容时的回调函数
 * @param abortSignal 用于终止请求的信号
 */
export async function fetchAiStream(text: string, onUpdate: (content: string) => void, abortSignal?: AbortSignal): Promise<string> {
  try {
    const store = await Store.load('store.json')
    const baseURL = await store.get<string>('baseURL')
    const model = await store.get<string>('model') || 'gpt-3.5-turbo'
    const aiType = await store.get<string>('aiType') || 'openai'
    const temperature = await store.get<number>('temperature') || 0.7
    const topP = await store.get<number>('topP') || 1
    const chatLanguage = await store.get<string>('chatLanguage') || 'en'
    
    if (!baseURL) {
      toast({
        title: 'AI 错误',
        description: '请先设置 AI 地址',
        variant: 'destructive',
      })
      return ''
    }
    
    // 获取prompt内容
    const promptContent = await getPromptContent() + '\n\n' + `Use **${chatLanguage}** to answer.`
    // 创建 OpenAI 客户端
    const openai = await createOpenAIClient()
    
    // 定义消息数组
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    
    // 根据不同AI类型构建请求
    if (aiType === 'gemini') {
      // 对于Gemini，我们将使用@google/genai库，这里的messages只是占位
      // 实际执行时会创建Gemini客户端
      const finalText = promptContent ? `${promptContent}\n\n${text}` : text
      messages = [{
        role: 'user', 
        content: finalText
      }]
    } else if (aiType === 'ollama') {
      // Ollama API请求
      if (promptContent) {
        messages.push({
          role: 'system',
          content: promptContent
        })
      }
      
      messages.push({
        role: 'user',
        content: text
      })
    } else {
      // OpenAI 请求
      if (promptContent) {
        messages.push({
          role: 'system',
          content: promptContent
        })
      }
      
      messages.push({
        role: 'user',
        content: text
      })
    }
    
    // 根据不同AI类型进行流式请求
    if (aiType === 'gemini') {
      // Gemini API流式请求使用@google/genai
      const genAI = await createGeminiClient()
      
      // 从消息中提取出用户文本
      const userMessage = messages[0].content as string
      
      let fullContent = ''
      const response = await genAI.models.generateContentStream({
        model: model,
        contents: {
          parts: [{ text: userMessage }]
        },
        temperature: temperature,
        topP: topP
      })
      
      for await (const chunk of response) {
        // Check if the request has been aborted
        if (abortSignal?.aborted) {
          break;
        }
        
        if (chunk.text) {
          fullContent += chunk.text
          onUpdate(fullContent)
        }
      }
      
      return fullContent
    } else {
      // OpenAI/Ollama流式请求
      const stream = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        top_p: topP,
        stream: true,
      })
      
      let thinking = ''
      let fullContent = ''
      
      for await (const chunk of stream) {
        // Check if the request has been aborted
        if (abortSignal?.aborted) {
          break;
        }
        
        const thinkingContent = (chunk.choices[0]?.delta as any)?.reasoning_content || ''
        const content = chunk.choices[0]?.delta?.content || ''
        // 如果存在 thinkingContent 则每次将内容插入到 fullContent 的 <thinking></thinking> 标签中，只保留一个<thinking></thinking>标签
        if (thinkingContent) {
          thinking += thinkingContent
          fullContent = `<thinking>${thinking}<thinking>`
        }
        if (content) {
          fullContent += content
        }
        onUpdate(fullContent)
      }
      
      return fullContent
    }
  } catch (error) {
    toast({
      title: 'AI 错误',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
    return `请求失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

/**
 * 流式方式获取AI结果，每次返回本次 token
 * @param text 请求文本
 * @param onUpdate 每次收到流式内容时的回调函数
 */
export async function fetchAiStreamToken(text: string, onUpdate: (content: string) => void): Promise<string> {
  try {
    const store = await Store.load('store.json')
    const baseURL = await store.get<string>('baseURL')
    const model = await store.get<string>('model') || 'gpt-3.5-turbo'
    const aiType = await store.get<string>('aiType') || 'openai'
    const temperature = await store.get<number>('temperature') || 0.7
    const topP = await store.get<number>('topP') || 1
    const chatLanguage = await store.get<string>('chatLanguage') || 'en'
    
    if (!baseURL) {
      toast({
        title: 'AI 错误',
        description: '请先设置 AI 地址',
        variant: 'destructive',
      })
      return ''
    }
    
    // 获取prompt内容
    const promptContent = await getPromptContent() + '\n\n' + `Use **${chatLanguage}** to answer.`
    
    // 创建 OpenAI 客户端
    const openai = await createOpenAIClient()
    
    // 定义消息数组
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    
    // 根据不同AI类型构建请求
    if (aiType === 'gemini') {
      // 对于Gemini，我们将使用@google/genai库，这里的messages只是占位
      // 实际执行时会创建Gemini客户端
      const finalText = promptContent ? `${promptContent}\n\n${text}` : text
      messages = [{
        role: 'user', 
        content: finalText
      }]
    } else if (aiType === 'ollama') {
      // Ollama API请求
      if (promptContent) {
        messages.push({
          role: 'system',
          content: promptContent
        })
      }
      
      messages.push({
        role: 'user',
        content: text
      })
    } else {
      // OpenAI 请求
      if (promptContent) {
        messages.push({
          role: 'system',
          content: promptContent
        })
      }
      
      messages.push({
        role: 'user',
        content: text
      })
    }
    
    // 根据不同AI类型进行流式请求
    if (aiType === 'gemini') {
      // Gemini API流式请求使用@google/genai
      const genAI = await createGeminiClient()
      
      // 从消息中提取出用户文本
      const userMessage = messages[0].content as string
      
      const streamingResult = await genAI.models.generateContentStream({
        model: model,
        contents: {
          parts: [{ text: userMessage }]
        },
        temperature: temperature,
        topP: topP
      })
      
      for await (const chunk of streamingResult) {
        if (chunk.text) {
          onUpdate(chunk.text)
        }
      }
      
      return ''
    } else {
      // OpenAI/Ollama流式请求
      const stream = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        top_p: topP,
        stream: true,
      })
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          onUpdate(content)
        }
      }
      
      return ''
    }
  } catch (error) {
    toast({
      title: 'AI 错误',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
    return `请求失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
}

export async function fetchAiDesc(text: string) {
  try {
    const store = await Store.load('store.json')
    const baseURL = await store.get<string>('baseURL')
    const model = await store.get<string>('model') || 'gpt-3.5-turbo'
    const aiType = await store.get<string>('aiType') || 'openai'
    const temperature = await store.get<number>('temperature') || 0.7
    const topP = await store.get<number>('topP') || 1
    
    if (!baseURL) return null;
    
    const descContent = `
      根据截图的内容：${text}，返回一条描述，不要超过50字，不要包含特殊字符。
    `
    
    if (aiType === 'gemini') {
      // 创建 Gemini 客户端
      const genAI = await createGeminiClient()
      
      // 使用 Gemini API
      const result = await genAI.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: descContent }]
        }
      })
      
      // 获取响应文本
      return result.candidates?.[0]?.content?.parts?.[0]?.text || ''      
    } else {
      // 创建 OpenAI 客户端
      const openai = await createOpenAIClient()
      
      // OpenAI/Ollama使用OpenAI库
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [{
          role: 'user' as const,
          content: descContent
        }],
        temperature: temperature,
        top_p: topP,
      })
      
      return completion.choices[0].message.content || ''
    }
  } catch (error) {
    toast({
      title: 'AI 错误',
      description: error instanceof Error ? error.message : '未知错误',
      variant: 'destructive',
    })
    return null
  }
}

export async function checkAiStatus() {
  try {
    const store = await Store.load('store.json')
    const baseURL = await store.get<string>('baseURL')
    const aiType = await store.get<string>('aiType')
    const model = await store.get<string>('model') || 'gpt-3.5-turbo'
    
    if (!baseURL || !aiType) return false

    // 创建 OpenAI 客户端
    const openai = await createOpenAIClient()

    if (aiType === 'gemini') {
      // Gemini - 使用@google/genai
      const genAI = await createGeminiClient()
      
      await genAI.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: 'Hello' }]
        }
      })
    } else if (aiType === 'ollama') {
      // Ollama
      await openai.chat.completions.create({
        model,
        messages: [{
          role: 'user' as const,
          content: 'Hello'
        }],
      })
    } else {
      // OpenAI
       // 检测连接
      await openai.chat.completions.create({
        model,
        messages: [{
          role: 'user' as const,
          content: 'Hello'
        }],
      })
    }
    return true
  } catch {
    // 捕获错误但不处理
    return false
  }
}

export async function getModels() {
  try {
    const store = await Store.load('store.json')
    const baseURL = await store.get<string>('baseURL')
    const aiType = await store.get<string>('aiType')
    if (!baseURL || !aiType) return []
    
    if (aiType === 'gemini') {
      return []
    } else {
      // OpenAI/Ollama模型列表
      const openai = await createOpenAIClient()
      const models = await openai.models.list()
      const uniqueModels = models.data.filter((model, index) => models.data.findIndex(m => m.id === model.id) === index)
      return uniqueModels
    }
  } catch {
    return []
  }
}