import { useId, useMemo, useState } from 'react'

type SearchableOption = {
  value: string | number
  label: string
  helper?: string | null
}

type Props = {
  id?: string
  name?: string
  value: string | number | null | undefined
  options: SearchableOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  onChangeValue: (value: string) => void
}

function normalizarTexto(valor: string) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export default function SearchableSelect({
  id,
  name,
  value,
  options,
  placeholder = 'Escribe para buscar...',
  disabled = false,
  required = false,
  className = '',
  onChangeValue,
}: Props) {
  const [textoManual, setTextoManual] = useState('')
  const [editando, setEditando] = useState(false)
  const reactId = useId().replace(/:/g, '')

  const baseId = id || name || `searchable-${reactId}`
  const listId = `${baseId}-list`

  const opcionesNormalizadas = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        valueText: String(option.value),
        search: normalizarTexto(`${option.label} ${option.helper || ''}`),
      })),
    [options]
  )

  const opcionSeleccionada = useMemo(
    () => opcionesNormalizadas.find((option) => option.valueText === String(value || '')),
    [opcionesNormalizadas, value]
  )

  const textoVisible = editando ? textoManual : opcionSeleccionada?.label || textoManual || ''

  function resolverSeleccion(textoActual: string) {
    const buscado = normalizarTexto(textoActual)

    setEditando(false)

    if (!buscado) {
      setTextoManual('')
      onChangeValue('')
      return
    }

    const exacta = opcionesNormalizadas.find(
      (option) => normalizarTexto(option.label) === buscado
    )

    if (exacta) {
      setTextoManual(exacta.label)
      onChangeValue(exacta.valueText)
      return
    }

    const contenida = opcionesNormalizadas.find((option) => option.search.includes(buscado))

    if (contenida) {
      setTextoManual(contenida.label)
      onChangeValue(contenida.valueText)
      return
    }

    setTextoManual(opcionSeleccionada?.label || '')
  }

  return (
    <div className={`searchableSelect ${className}`.trim()}>
      <input
        id={id}
        name={`${name || id || 'searchable'}Text`}
        value={textoVisible}
        list={listId}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        onFocus={() => {
          setEditando(true)
          setTextoManual(opcionSeleccionada?.label || '')
        }}
        onChange={(event) => {
          const nuevoTexto = event.target.value
          setEditando(true)
          setTextoManual(nuevoTexto)

          const exacta = opcionesNormalizadas.find(
            (option) => normalizarTexto(option.label) === normalizarTexto(nuevoTexto)
          )

          if (exacta) onChangeValue(exacta.valueText)
        }}
        onBlur={(event) => resolverSeleccion(event.target.value)}
      />

      <datalist id={listId}>
        {opcionesNormalizadas.map((option) => (
          <option key={option.valueText} value={option.label} />
        ))}
      </datalist>

      <input type="hidden" name={name} value={value ?? ''} />
    </div>
  )
}