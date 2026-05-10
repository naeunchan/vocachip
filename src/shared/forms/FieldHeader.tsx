interface FieldHeaderProps {
  label: string;
  helper?: string;
  meta?: string;
  htmlFor?: string;
  helperId?: string;
}

function FieldHeaderLabel({
  label,
  meta,
  htmlFor,
}: Pick<FieldHeaderProps, "label" | "meta" | "htmlFor">) {
  if (htmlFor) {
    return (
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {meta ? <span className="field-meta">{meta}</span> : null}
      </label>
    );
  }

  return (
    <div className="field-label">
      {label}
      {meta ? <span className="field-meta">{meta}</span> : null}
    </div>
  );
}

export function FieldHeader({
  label,
  helper,
  meta,
  htmlFor,
  helperId,
}: FieldHeaderProps) {
  return (
    <>
      <FieldHeaderLabel label={label} meta={meta} htmlFor={htmlFor} />
      {helper ? (
        <p className="field-helper" id={helperId}>
          {helper}
        </p>
      ) : null}
    </>
  );
}
