import '../styles/entry-form.css'

// Renders one labeled input per field in a template's field_schema. Shared
// between NewEntryForm (Phase 2) and the search results' inline edit view
// (Phase 3) so both stay in sync with whatever fields a template defines —
// Phase 4's form builder only needs to change field_schema, not either of
// those components.
//
// idPrefix keeps DOM ids unique when more than one instance can be on the
// page at once (e.g. several search results in edit mode simultaneously).
export default function EntryFieldInputs({ fieldSchema, values, onChange, idPrefix = '' }) {
  return (
    <>
      {fieldSchema?.map((field) => {
        const inputId = `${idPrefix}${field.key}`
        return (
          <div className="entry-form-field" key={field.key}>
            <label htmlFor={inputId}>
              {field.label}
              {field.required && <span className="entry-form-required"> *</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={inputId}
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                required={field.required}
              />
            ) : (
              <input
                id={inputId}
                type="text"
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                required={field.required}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export function emptyValuesFor(template) {
  const values = {}
  template?.field_schema?.forEach((field) => {
    values[field.key] = ''
  })
  return values
}
