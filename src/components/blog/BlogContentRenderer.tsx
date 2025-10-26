import { useState } from "react";
import { ImageZoomModal } from "./ImageZoomModal";

interface BlogContentRendererProps {
  content: any; // TipTap JSON content
}

export const BlogContentRenderer = ({ content }: BlogContentRendererProps) => {
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);

  if (!content || !content.content) {
    return null;
  }

  const renderNode = (node: any, index: number): JSX.Element | null => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-4">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </p>
        );

      case 'heading':
        const HeadingTag = `h${node.attrs?.level || 2}` as any;
        return (
          <HeadingTag key={index} className="font-bold mt-8 mb-4">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </HeadingTag>
        );

      case 'text':
        let text = node.text;
        let element: JSX.Element = <span>{text}</span>;
        
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case 'bold':
                element = <strong>{element}</strong>;
                break;
              case 'italic':
                element = <em>{element}</em>;
                break;
              case 'underline':
                element = <u>{element}</u>;
                break;
              case 'link':
                element = (
                  <a href={mark.attrs?.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {element}
                  </a>
                );
                break;
              case 'code':
                element = <code className="bg-muted px-1 rounded">{element}</code>;
                break;
            }
          });
        }
        
        return element;

      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside mb-4 ml-4">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside mb-4 ml-4">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ol>
        );

      case 'listItem':
        return (
          <li key={index}>
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </li>
        );

      case 'blockquote':
        return (
          <blockquote key={index} className="border-l-4 border-primary pl-4 italic my-6">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </blockquote>
        );

      case 'codeBlock':
        return (
          <pre key={index} className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
            <code>
              {node.content?.map((child: any) => child.text).join('')}
            </code>
          </pre>
        );

      case 'image':
        return (
          <img
            key={index}
            src={node.attrs?.src}
            alt={node.attrs?.alt || ''}
            title={node.attrs?.title}
            className="max-w-full h-auto rounded-lg my-6 cursor-zoom-in hover:opacity-90 transition-opacity"
            onClick={() => setZoomImage({ src: node.attrs?.src, alt: node.attrs?.alt || '' })}
          />
        );

      case 'horizontalRule':
        return <hr key={index} className="my-8 border-border" />;

      case 'table':
        return (
          <div key={index} className="overflow-x-auto my-6">
            <table className="border-collapse table-auto w-full">
              <tbody>
                {node.content?.map((child: any, i: number) => renderNode(child, i))}
              </tbody>
            </table>
          </div>
        );

      case 'tableRow':
        const isEvenRow = index % 2 === 0;
        return (
          <tr 
            key={index} 
            className={isEvenRow ? "bg-muted/50" : "bg-background"}
          >
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </tr>
        );

      case 'tableHeader':
        return (
          <th 
            key={index} 
            className="border border-border px-4 py-2 text-left font-bold bg-muted"
          >
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </th>
        );

      case 'tableCell':
        return (
          <td 
            key={index} 
            className="border border-border px-4 py-2"
          >
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </td>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="blog-content">
        {content.content.map((node: any, index: number) => renderNode(node, index))}
      </div>
      
      {zoomImage && (
        <ImageZoomModal
          src={zoomImage.src}
          alt={zoomImage.alt}
          isOpen={!!zoomImage}
          onClose={() => setZoomImage(null)}
        />
      )}
    </>
  );
};
