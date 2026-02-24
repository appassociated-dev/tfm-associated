# Agent Aliases - Identificadores de Agentes IA

## Propósito

Define alias estandarizados para agentes IA que se usan en nomenclatura de archivos de sesión.

## Formato de Alias

**Requisitos:**
- Descriptivo (permite intuir el agente)
- Solo caracteres alfanuméricos [a-zA-Z0-9]
- Sin espacios, guiones, puntos ni caracteres especiales
- CamelCase o UPPERCASE preferido para legibilidad

## Agentes Comunes

| Agente IA | Alias | Descripción |
|-----------|-------|-------------|
| Claude (Anthropic) | `CLAUDE` | Claude en claude.ai |
| Claude Code | `CLAUDECODE` | Claude Code (CLI tool) |
| Claude Sonnet | `SONNET` | Claude Sonnet específicamente |
| Claude Opus | `OPUS` | Claude Opus específicamente |
| Claude Haiku | `HAIKU` | Claude Haiku específicamente |
| GPT-4 (OpenAI) | `GPT4` | GPT-4 en ChatGPT o API |
| GPT-4o | `GPT4O` | GPT-4o (omni) |
| GPT-3.5 | `GPT35` | GPT-3.5 Turbo |
| GitHub Copilot | `COPILOT` | GitHub Copilot en VS Code |
| GitHub Copilot Chat | `COPILOTCHAT` | Copilot Chat (conversacional) |
| Cursor | `CURSOR` | Cursor AI editor |
| Codeium | `CODEIUM` | Codeium AI assistant |
| Tabnine | `TABNINE` | Tabnine autocomplete |
| Gemini (Google) | `GEMINI` | Google Gemini |
| Gemini Pro | `GEMINIPRO` | Gemini Pro específicamente |
| CodeLlama | `CODELLAMA` | Meta CodeLlama |
| Llama 3 | `LLAMA3` | Meta Llama 3 |
| Mixtral | `MIXTRAL` | Mistral AI Mixtral |
| Codex (OpenAI) | `CODEX` | OpenAI Codex (legacy) |
| Amazon CodeWhisperer | `CODEWHISPERER` | AWS CodeWhisperer |
| Replit AI | `REPLIT` | Replit Ghostwriter |
| Windsurf | `WINDSURF` | Windsurf AI |
| Aider | `AIDER` | Aider AI pair programmer |

## Agente No Listado

Si usas un agente no en esta tabla:

1. **Crea alias siguiendo requisitos** (descriptivo, alfanumérico, sin espacios)
2. **Usa consistentemente** en todas las sesiones
3. **Ejemplos válidos:**
   - `CUSTOM` - Para agente custom propio
   - `LOCALLLM` - Para LLM local
   - `OLLAMA` - Para Ollama
   - `OPENASSISTANT` - Para Open Assistant

## Ejemplos de Uso

**Archivo de sesión:**
```
20260211-001-adrian-CLAUDE.md
20260211-002-maria-GPT4.md
20260211-003-carlos-COPILOT.md
20260212-001-adrian-SONNET.md
```

## Sanitización

El skill aplica automáticamente regex `[a-zA-Z0-9]` a:
- Nombre de usuario (USER_SESSION_MANAGER)
- Alias de agente (si el agente proporciona uno no estándar)

**Caracteres eliminados:** espacios, guiones, puntos, símbolos, acentos, etc.

**Ejemplos:**
- `Claude Code` → `ClaudeCode`
- `GPT-4o` → `GPT4o`
- `user.name` → `username`
