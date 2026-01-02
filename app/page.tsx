"use client"

import React, { useState, useRef } from 'react';
import { Play, Trash2, Copy, Check, Code2 } from 'lucide-react';

export default function CodeRunner() {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(`public class Main {
    public static void main(String[] args) {
        System.out.println("Hola desde Java!");
        
        // Ejemplo de operaciones
        int suma = 5 + 3;
        System.out.println("5 + 3 = " + suma);
        
        // Ejemplo de bucle
        for(int i = 1; i <= 5; i++) {
            System.out.println("Iteracion: " + i);
        }
    }
}`);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const codeExamples = {
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("¡Hola desde Java!");
        
        // Ejemplo de operaciones
        int suma = 5 + 3;
        System.out.println("5 + 3 = " + suma);
        
        // Ejemplo de bucle
        for(int i = 1; i <= 5; i++) {
            System.out.println("Iteración: " + i);
        }
    }
}`,
    python: `# ¡Hola desde Python!
print("¡Hola desde Python!")

# Ejemplo de operaciones
suma = 5 + 3
print(f"5 + 3 = {suma}")

# Ejemplo de bucle
for i in range(1, 6):
    print(f"Iteración: {i}")

# Ejemplo de lista
numeros = [1, 2, 3, 4, 5]
print(f"Lista: {numeros}")`
  };

  const handleLanguageChange = (newLang: keyof typeof codeExamples) => {
    setLanguage(newLang);
    setCode(codeExamples[newLang]);
    setOutput('');
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Tab para indentar
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    '; // 4 espacios

      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
    
    // Auto-indent al presionar Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const lines = code.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];

      // Contar espacios al inicio de la línea actual
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      // Agregar indentación extra si la línea termina con { o :
      let extraIndent = '';
      if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':')) {
        extraIndent = '    ';
      }
      
      const newCode = code.substring(0, start) + '\n' + indent + extraIndent + code.substring(start);
      setCode(newCode);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;
      }, 0);
    }
  };

  const formatCode = () => {
    let formatted = code;
    
    if (language === 'python') {
      // Formateo básico para Python
      const lines = code.split('\n');
      let indentLevel = 0;
      formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // Reducir indentación antes de ciertas palabras
        if (trimmed.startsWith('elif ') || trimmed.startsWith('else:') || 
            trimmed.startsWith('except ') || trimmed.startsWith('finally:')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const result = '    '.repeat(indentLevel) + trimmed;
        
        // Aumentar indentación después de :
        if (trimmed.endsWith(':')) {
          indentLevel++;
        }
        
        // Reducir indentación después de estas líneas
        if (trimmed.startsWith('return ') || trimmed.startsWith('break') || 
            trimmed.startsWith('continue') || trimmed.startsWith('pass')) {
          // No hacer nada especial
        }
        
        return result;
      }).join('\n');
      
    } else if (language === 'java') {
      // Formateo básico para Java
      const lines = code.split('\n');
      let indentLevel = 0;
      formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // Reducir indentación antes de }
        if (trimmed.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const result = '    '.repeat(indentLevel) + trimmed;
        
        // Aumentar indentación después de {
        if (trimmed.endsWith('{')) {
          indentLevel++;
        }
        
        // Reducir después de }
        if (trimmed.endsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        return result;
      }).join('\n');
    }
    
    setCode(formatted);
  };

  const executeCode = async () => {
    setIsRunning(true);
    setOutput(`Ejecutando código ${language === 'java' ? 'Java' : 'Python'}...\n`);

    try {
      const config = language === 'java' 
        ? { language: 'java', version: '15.0.2', filename: 'Main.java' }
        : { language: 'python', version: '3.10.0', filename: 'main.py' };

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: config.language,
          version: config.version,
          files: [
            {
              name: config.filename,
              content: code
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.run) {
        const output = data.run.output || '';
        const stderr = data.run.stderr || '';
        
        if (stderr) {
          setOutput(`❌ Error:\n${stderr}`);
        } else if (output) {
          setOutput(`✅ Salida:\n${output}`);
        } else {
          setOutput('✅ Código ejecutado sin salida');
        }
      } else {
        setOutput('❌ Error al ejecutar el código');
      }
    } catch (error: unknown) {
      setOutput(`❌ Error de conexión: ${(error as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightCode = (code: string, lang: string) => {
    if (lang === 'java') {
      const keywords = /\b(public|private|protected|static|final|void|class|interface|extends|implements|import|package|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|int|double|float|long|short|byte|char|boolean|String|true|false|null)\b/g;
      const singleLineComment = /\/\/.*/g;
      const multiLineComment = /\/\*[\s\S]*?\*\//g;
      const strings = /"(?:[^"\\]|\\.)*"/g;
      const numbers = /\b\d+\.?\d*\b/g;
      const methods = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
      const annotations = /@[a-zA-Z_][a-zA-Z0-9_]*/g;

      let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      highlighted = highlighted
        .replace(multiLineComment, (match) => `<span style='color: #6A9955;'>${match}</span>`)
        .replace(singleLineComment, (match) => `<span style='color: #6A9955;'>${match}</span>`)
        .replace(strings, (match) => `<span style='color: #CE9178;'>${match}</span>`)
        .replace(annotations, (match) => `<span style='color: #DCDCAA;'>${match}</span>`)
        .replace(keywords, (match) => `<span style='color: #569CD6;'>${match}</span>`)
        .replace(numbers, (match) => `<span style='color: #B5CEA8;'>${match}</span>`)
        .replace(methods, (match) => `<span style='color: #DCDCAA;'>${match}</span>`);

      return highlighted;
    } else if (lang === 'python') {
      const keywords = /\b(def|class|import|from|as|if|elif|else|for|while|return|break|continue|pass|try|except|finally|raise|with|lambda|yield|async|await|True|False|None|and|or|not|in|is|global|nonlocal)\b/g;
      const comment = /# .*/g;
      const strings = /(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
      const numbers = /\b\d+\.?\d*\b/g;
      const functions = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
      const decorators = /@[a-zA-Z_][a-zA-Z0-9_]*/g;

      let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      highlighted = highlighted
        .replace(strings, (match) => `<span style='color: #CE9178;'>${match}</span>`)
        .replace(comment, (match) => `<span style='color: #6A9955;'>${match}</span>`)
        .replace(decorators, (match) => `<span style='color: #DCDCAA;'>${match}</span>`)
        .replace(keywords, (match) => `<span style='color: #C586C0;'>${match}</span>`)
        .replace(numbers, (match) => `<span style='color: #B5CEA8;'>${match}</span>`)
        .replace(functions, (match) => `<span style='color: #DCDCAA;'>${match}</span>`);

      return highlighted;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Code Runner
          </h1>
          <p className="text-slate-400">Ejecuta código Java y Python en tiempo real</p>
        </div>

        {/* Language Selector */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => handleLanguageChange('java')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              language === 'java'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ☕ Java
          </button>
          <button
            onClick={() => handleLanguageChange('python')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              language === 'python'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🐍 Python
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-3 text-sm font-medium text-orange-400">
                  {language === 'java' ? 'Main.java' : 'main.py'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={formatCode}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                  title="Formatear código"
                >
                  <Code2 size={16} />
                </button>
                <button
                  onClick={clearCode}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                  title="Limpiar código"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="relative h-96">
              <pre
                ref={highlightRef}
                className="absolute inset-0 bg-slate-900 text-white font-mono text-sm p-4 overflow-auto pointer-events-none"
                style={{ 
                  fontFamily: 'Monaco, Consolas, monospace',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: highlightCode(code, language) } as { __html: string }}
              />
              
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white font-mono text-sm p-4 focus:outline-none resize-none"
                style={{ 
                  fontFamily: 'Monaco, Consolas, monospace',
                  caretColor: 'white'
                }}
                spellCheck={false}
              />
            </div>
            
            <div className="bg-slate-800 px-4 py-3 border-t border-slate-700">
              <button
                onClick={executeCode}
                disabled={isRunning}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-700 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                <Play size={18} />
                {isRunning ? 'Ejecutando...' : 'Ejecutar Código'}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <span className="text-sm font-medium text-green-400">Consola</span>
              {output && (
                <button
                  onClick={copyOutput}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5 text-xs"
                  title="Copiar salida"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              )}
            </div>
            
            <div className="h-96 bg-slate-900 p-4 overflow-auto">
              {output ? (
                <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">
                  {output}
                </pre>
              ) : (
                <div className="text-slate-500 text-sm">
                  La salida aparecerá aquí...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">⌨️ Atajos</h3>
            <p className="text-sm text-slate-300">
              <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">Tab</kbd> para indentar<br/>
              <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">Enter</kbd> auto-indenta
            </p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-green-400 mb-2">✨ Formatear</h3>
            <p className="text-sm text-slate-300">
              Usa el botón <Code2 size={14} className="inline"/> para formatear tu código automáticamente
            </p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">🚀 Próximamente</h3>
            <p className="text-sm text-slate-300">
              TypeScript y JavaScript
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}