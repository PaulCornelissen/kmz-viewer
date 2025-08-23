import React from 'react'


export function Dropzone({ onFile }: { onFile: (file: File) => void }) {
    const inputRef = React.useRef<HTMLInputElement>(null)


    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) onFile(f)
    }


    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
    }


    return (
        <div className="section">
            <h3 className="h">Bestand</h3>
            <div
                className="drop"
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
            >
                <p>Drop je <strong>.kmz</strong> hier of klik om te bladeren</p>
                <input ref={inputRef} type="file" accept=".kmz" hidden onChange={onChange} />
            </div>
        </div>
    )
}