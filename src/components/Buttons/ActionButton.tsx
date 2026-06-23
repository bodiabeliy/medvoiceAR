
const ActionButton = (props: any) => {
  const {onClick, disabled} = props
  return (
    <>
        <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={` ${props.className} `}
    >
      {props.text}
    </button>

    </>
  )
}

export default ActionButton;
