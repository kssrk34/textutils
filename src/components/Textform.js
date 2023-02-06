import React,{useState} from 'react'

export default function Textform(props) {
    const [text, setText] = useState("Enter the input here");
    const handleUPclick=()=>{
        // console.log("Button was clicked");
        let newtext=text.toUpperCase();
        setText(newtext);
    }
    const handleDownclick=()=>{
        // console.log("Button was clicked");
        let newtext=text.toLowerCase();
        setText(newtext);
    }
    const handleclear=()=>{
        let newtext="";
        setText(newtext);
    }
    const onchange=(event)=>{
        // console.log("onchange");
        setText(event.target.value);
    }
    const handlecopy=()=>{
        var text= document.getElementById("exampleFormControlTextarea1");
        text.select();
        navigator.clipboard.writeText(text.value);
    }
    const handlees=()=>{
        let newText=text.split(/[ ]+/);
        setText(newText.join(" "));
    }
  return (
    <>
    <div className="container my-3" style={{color:props.mode==="dark"?"white":"black"}}>
        <h1>Enter your input in the box</h1>
    <div className="mb-3 my-3" >
    <textarea className="form-control" value={text} style={{backgroundColor:props.mode==="dark"?"#03133a":"white", color:props.mode==="dark"?"white":"black"}}onChange={onchange} id="exampleFormControlTextarea1" rows="8"></textarea>
    </div>
    </div>
    <div className="container" >
    <button type="button" onClick={handleUPclick} className="btn btn-primary mx-1">Convert to Uppercase</button>
    <button type="button" onClick={handleDownclick} className="btn btn-primary mx-2">Convert to Lowercase</button>
    <button type="button" onClick={handleclear} className="btn btn-primary mx-2">Clear Text</button>
    <button type="button" onClick={handlecopy} className="btn btn-primary mx-2">Copy Text</button>
    <button type="button" onClick={handlees} className="btn btn-primary">Remove spaces</button>

    </div>
    <div className="container my-3" style={{color:props.mode==="dark"?"white":"black"}}>
        <h1> Text summary</h1>
        <p>{text.split(" ").filter((element)=>{return element.length!==0}).length} words {text.length} characters</p>
        <h2>Text preview</h2>
        <p>{text.length>0?text:"Enter the input in the text box to preview it here"}</p>
    </div>
</>
  )
}
