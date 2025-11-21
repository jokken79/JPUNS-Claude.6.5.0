# 🤖 Guía de GitHub Copilot CLI - Configuración de Modelos

## 📋 Descripción

Esta guía te ayuda a configurar y cambiar los modelos de IA en **GitHub Copilot CLI** (terminal).

---

## 🎯 **Modelos Disponibles**

| Modelo | Código | Velocidad | Costo | Uso Recomendado |
|--------|--------|-----------|-------|-----------------|
| **Claude 3.5 Haiku** | `haiku` | ⚡⚡⚡ Muy rápido | 💰 Económico | Preguntas rápidas, código simple |
| **Claude 3.5 Sonnet** | `sonnet` | ⚡⚡ Rápido | 💰💰 Moderado | Balance ideal (DEFAULT) |
| **Claude Sonnet 4** | `claude-sonnet-4-20250514` | ⚡ Normal | 💰💰💰 Caro | Problemas complejos |
| **GPT-4o** | `gpt-4o` | ⚡⚡ Rápido | 💰💰 Moderado | Alternativa OpenAI |

---

## 🔧 **Cómo Cambiar el Modelo**

### **Opción 1: Cambio Permanente (Recomendado)**

#### **Windows (CMD/PowerShell):**
```cmd
setx GITHUB_COPILOT_MODEL "haiku"
```

**Importante:** Cierra y vuelve a abrir la terminal para que tenga efecto.

#### **Linux/Mac (Bash/Zsh):**
```bash
echo 'export GITHUB_COPILOT_MODEL="haiku"' >> ~/.bashrc
source ~/.bashrc
```

O para Zsh:
```bash
echo 'export GITHUB_COPILOT_MODEL="haiku"' >> ~/.zshrc
source ~/.zshrc
```

---

### **Opción 2: Cambio Temporal (Solo Sesión Actual)**

#### **Windows:**
```cmd
set GITHUB_COPILOT_MODEL=haiku
```

#### **Linux/Mac:**
```bash
export GITHUB_COPILOT_MODEL="haiku"
```

---

### **Opción 3: Por Comando (Sin Configurar)**

Usa el flag `--model` cada vez:

```cmd
gh copilot --model haiku "tu pregunta aquí"
```

---

## ✅ **Verificar Configuración Actual**

### **Ver modelo configurado:**

**Windows:**
```cmd
echo %GITHUB_COPILOT_MODEL%
```

**Linux/Mac:**
```bash
echo $GITHUB_COPILOT_MODEL
```

**Si no muestra nada:** No hay modelo configurado, usa el default (Sonnet 3.5)

---

### **Probar que funciona:**

```cmd
gh copilot "¿qué modelo estás usando?"
```

O simplemente haz cualquier pregunta y verás la diferencia en velocidad.

---

## 🔄 **Cambiar entre Modelos**

### **Cambiar a Haiku (Rápido y Económico):**
```cmd
setx GITHUB_COPILOT_MODEL "haiku"
```

### **Cambiar a Sonnet 3.5 (Balance):**
```cmd
setx GITHUB_COPILOT_MODEL "sonnet"
```

### **Cambiar a Sonnet 4 (Más Potente):**
```cmd
setx GITHUB_COPILOT_MODEL "claude-sonnet-4-20250514"
```

### **Cambiar a GPT-4o (OpenAI):**
```cmd
setx GITHUB_COPILOT_MODEL "gpt-4o"
```

### **Volver al Default (Sin configuración):**

**Windows:**
```cmd
reg delete HKCU\Environment /F /V GITHUB_COPILOT_MODEL
```

**Linux/Mac:**
```bash
unset GITHUB_COPILOT_MODEL
```

---

## 📊 **Comparación de Modelos**

### **Claude 3.5 Haiku** (`haiku`)

**✅ Ventajas:**
- Muy rápido (respuestas en 1-2 segundos)
- Económico (bajo consumo de créditos)
- Perfecto para preguntas rápidas
- Buen rendimiento en código simple

**❌ Limitaciones:**
- Menos capacidad de razonamiento profundo
- Puede fallar en problemas muy complejos

**Usa para:**
- Debugging rápido
- Explicar código existente
- Generar código simple
- Preguntas de sintaxis

---

### **Claude 3.5 Sonnet** (`sonnet`) - DEFAULT

**✅ Ventajas:**
- Balance perfecto velocidad/calidad
- Muy bueno para la mayoría de tareas
- Razonamiento sólido
- Modelo por defecto de Copilot

**❌ Limitaciones:**
- Un poco más lento que Haiku
- Costo moderado

**Usa para:**
- Todo uso general
- Arquitectura de código
- Refactoring
- Code review

---

### **Claude Sonnet 4** (`claude-sonnet-4-20250514`)

**✅ Ventajas:**
- El más potente de Claude
- Excelente razonamiento
- Maneja problemas muy complejos
- Mejor en debugging avanzado

**❌ Limitaciones:**
- Más lento (3-5 segundos)
- Más costoso
- Overkill para tareas simples

**Usa para:**
- Problemas arquitectónicos complejos
- Debugging multi-capa
- Optimización avanzada
- Diseño de sistemas

---

### **GPT-4o** (`gpt-4o`)

**✅ Ventajas:**
- Modelo de OpenAI
- Muy rápido
- Bueno en explicaciones
- Alternativa a Claude

**❌ Limitaciones:**
- Diferente estilo de respuesta
- Puede ser menos preciso en código

**Usa para:**
- Cuando quieres segunda opinión
- Explicaciones conceptuales
- Problemas creativos

---

## 🎯 **Recomendaciones por Caso de Uso**

### **Desarrollo Diario (80% del tiempo):**
```cmd
setx GITHUB_COPILOT_MODEL "haiku"
```
- Respuestas rápidas
- Bajo costo
- Suficiente para mayoría de tareas

---

### **Proyectos Complejos:**
```cmd
setx GITHUB_COPILOT_MODEL "sonnet"
```
- Balance ideal
- Buen razonamiento
- Confiable

---

### **Debugging Crítico o Arquitectura:**
```cmd
setx GITHUB_COPILOT_MODEL "claude-sonnet-4-20250514"
```
- Máxima potencia
- Para cuando realmente lo necesitas

---

## 🔍 **Troubleshooting**

### **Problema: El cambio no tiene efecto**

**Solución:**
1. Cierra TODAS las ventanas de terminal
2. Abre una nueva terminal
3. Verifica: `echo %GITHUB_COPILOT_MODEL%` (Windows) o `echo $GITHUB_COPILOT_MODEL` (Linux/Mac)

---

### **Problema: Error "Invalid model"**

**Solución:**
Usa uno de los modelos oficiales:
- `haiku`
- `sonnet`
- `claude-sonnet-4-20250514`
- `gpt-4o`

---

### **Problema: Respuestas muy lentas**

**Solución:**
Cambia a Haiku:
```cmd
setx GITHUB_COPILOT_MODEL "haiku"
```

---

### **Problema: Respuestas de baja calidad**

**Solución:**
Cambia a Sonnet 4:
```cmd
setx GITHUB_COPILOT_MODEL "claude-sonnet-4-20250514"
```

---

## 💡 **Tips de Uso**

### **Tip 1: Usa Haiku para preguntas rápidas**
```cmd
# Perfecto para Haiku
gh copilot "¿cómo iterar un array en JavaScript?"
gh copilot "explica esta función"
gh copilot "sintaxis de list comprehension en Python"
```

### **Tip 2: Usa Sonnet 4 para problemas complejos**
```cmd
# Mejor con Sonnet 4
gh copilot "diseña la arquitectura de un sistema de cache distribuido"
gh copilot "optimiza este algoritmo de búsqueda complejo"
gh copilot "debugging de memory leak en aplicación multi-threaded"
```

### **Tip 3: Cambia modelo según contexto**
```bash
# Para sesión rápida de coding
set GITHUB_COPILOT_MODEL=haiku

# Para code review importante
set GITHUB_COPILOT_MODEL=claude-sonnet-4-20250514
```

---

## 📝 **Configuraciones Rápidas**

### **Desarrollo Rápido (Haiku):**
```cmd
setx GITHUB_COPILOT_MODEL "haiku"
```

### **Desarrollo Normal (Sonnet 3.5):**
```cmd
setx GITHUB_COPILOT_MODEL "sonnet"
```

### **Desarrollo Avanzado (Sonnet 4):**
```cmd
setx GITHUB_COPILOT_MODEL "claude-sonnet-4-20250514"
```

### **Sin Preferencia (Default):**
```cmd
reg delete HKCU\Environment /F /V GITHUB_COPILOT_MODEL
```

---

## 🔗 **Comandos Útiles**

### **Ver modelo actual:**
```cmd
echo %GITHUB_COPILOT_MODEL%
```

### **Probar modelo:**
```cmd
gh copilot "hola, ¿qué modelo eres?"
```

### **Ver todas las variables de entorno:**
```cmd
set | findstr COPILOT
```

### **Ayuda de Copilot CLI:**
```cmd
gh copilot --help
```

---

## 📚 **Recursos Adicionales**

- **Documentación Oficial:** [GitHub Copilot CLI Docs](https://docs.github.com/en/copilot/github-copilot-in-the-cli)
- **Comparación de Modelos:** [Anthropic Claude Models](https://www.anthropic.com/claude)
- **Pricing:** Verifica tu plan de GitHub Copilot

---

## 🎓 **Mejores Prácticas**

1. ✅ **Usa Haiku por defecto** - Rápido y económico para 80% de tareas
2. ✅ **Cambia a Sonnet 4 cuando lo necesites** - Para problemas realmente complejos
3. ✅ **No uses Sonnet 4 para todo** - Desperdicia créditos y tiempo
4. ✅ **Verifica el modelo antes de sesiones largas** - `echo %GITHUB_COPILOT_MODEL%`
5. ✅ **Reinicia terminal después de cambiar** - Los cambios de `setx` requieren nueva sesión

---

## 🚀 **Quick Start**

**Para empezar rápido con Haiku:**

```cmd
setx GITHUB_COPILOT_MODEL "haiku"
```

**Cierra y abre nueva terminal, luego:**

```cmd
echo %GITHUB_COPILOT_MODEL%
gh copilot "hola"
```

¡Listo! Ahora estás usando Haiku 🎉

---

## 📊 **Resumen de Modelos**

| Quieres... | Usa este modelo | Comando |
|------------|----------------|---------|
| Velocidad máxima | Haiku | `setx GITHUB_COPILOT_MODEL "haiku"` |
| Balance perfecto | Sonnet 3.5 | `setx GITHUB_COPILOT_MODEL "sonnet"` |
| Máxima calidad | Sonnet 4 | `setx GITHUB_COPILOT_MODEL "claude-sonnet-4-20250514"` |
| Alternativa OpenAI | GPT-4o | `setx GITHUB_COPILOT_MODEL "gpt-4o"` |

---

**Última actualización:** 2025-01-12  
**Versión:** 1.0  
**Autor:** UNS-ClaudeJP Team

---

**¿Preguntas? Solo pregúntame: "¿cómo cambio a [modelo]?"** 😊
