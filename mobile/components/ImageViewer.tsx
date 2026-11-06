import {X} from 'lucide-react';

export function ImageViewer({image,onClose}:{image:{url:string;alt:string}|null;onClose:()=>void}){if(!image)return null;return <div className="image-viewer" role="dialog" aria-modal="true" aria-label={image.alt}><button onClick={onClose} aria-label="Kapat"><X/></button><div className="zoom-surface"><img src={image.url} alt={image.alt}/></div></div>}
