import CreatableSelect from 'react-select/creatable'

const MAX_TAG_LENGTH = 60

// "  Node   JS " -> "Node JS" (mesma regra do backend)
const normalize = (text) => text.trim().replace(/\s+/g, ' ')

// Estilos com as cores do projeto (tokens do index.css). O `unstyled` do react-select
// remove o visual padrão e mantém só o layout essencial (ex.: posição do menu).
const classNames = {
  control: ({ isFocused }) =>
    `w-full rounded-xl border bg-night px-2 py-2 text-ink transition-colors ${
      isFocused ? 'border-ember ring-2 ring-ember/25' : 'border-line hover:border-muted/60'
    }`,
  valueContainer: () => 'gap-1 px-2',
  input: () => 'text-ink [&_input]:outline-none',
  placeholder: () => 'text-muted/60',
  singleValue: () => 'text-ink',
  clearIndicator: () => 'rounded-md p-1 text-muted hover:text-ink',
  dropdownIndicator: () => 'rounded-md p-1 text-muted hover:text-ink',
  menu: () => 'mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-xl',
  menuList: () => 'max-h-56 p-1',
  option: ({ isFocused, isSelected }) =>
    `cursor-pointer rounded-lg px-3 py-2 ${
      isSelected ? 'bg-ember text-night' : isFocused ? 'bg-raised text-ink' : 'text-ink'
    }`,
  noOptionsMessage: () => 'px-3 py-2 text-sm text-muted',
}

// Só oferece "Criar tag" se o texto não for vazio, couber no limite e não existir
// (sem diferenciar maiúsculas) entre as tags já salvas: evita "java" ao lado de "Java".
const isValidNewOption = (input, selected, options) => {
  const name = normalize(input).toLowerCase()
  if (!name || name.length > MAX_TAG_LENGTH) return false
  return ![...selected, ...options].some((o) => o.label.toLowerCase() === name)
}

// O react-select trata Espaço com o campo vazio como "escolher a opção em foco". Com o menu
// aberto ao focar, um espaço acidental selecionaria a primeira tag sem o usuário perceber.
// Ao cancelar o evento, o react-select o ignora (e também não entram espaços à esquerda).
const blockLeadingSpace = (e) => {
  if (e.key === ' ' && !e.target.value) e.preventDefault()
}

/*
 * Seleção híbrida de tag (autocomplete + criação livre).
 *
 *   tags:     [{ id, nome }]  vindo de GET /studies/tags
 *   value:    null | { value, label, __isNew__? }
 *             - tag existente: value = id da tag
 *             - tag nova:      __isNew__ = true, label = nome digitado
 *   onChange: recebe o mesmo formato (ou null ao limpar)
 */
export default function TagSelect({ inputId, tags, value, onChange, disabled }) {
  const options = tags.map((t) => ({ value: t.id, label: t.nome }))

  return (
    <CreatableSelect
      unstyled
      classNames={classNames}
      inputId={inputId}
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={(input) => {
        const nome = normalize(input)
        onChange({ value: nome, label: nome, __isNew__: true })
      }}
      onKeyDown={blockLeadingSpace}
      isValidNewOption={isValidNewOption}
      formatCreateLabel={(input) => `Criar tag "${normalize(input)}"`}
      isDisabled={disabled}
      isClearable
      openMenuOnFocus
      placeholder="Busque ou crie uma tag (ex.: Java, Culinária)"
      noOptionsMessage={() => 'Nenhuma tag ainda. Digite para criar a primeira.'}
    />
  )
}
