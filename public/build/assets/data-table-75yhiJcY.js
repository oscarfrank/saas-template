import{r as a,j as e}from"./app-CMfsqCQM.js";import{u as Ie,f as te,c as Be,g as ze,b as Ge,a as Je}from"./index-3ZfaH849.js";import{T as He,a as We,b as v,c as qe,d as Xe,e as N}from"./table-4R1BSENb.js";import{B as x}from"./button-B2dnQCAa.js";import{I as le}from"./input-Bpdo4m0L.js";import{S as re,a as oe,b as ce,c as ae,d as ne}from"./select-CAt556DM.js";import{D as _,a as V,b as T,c as p,d as D,g as Ke}from"./dropdown-menu-D-TuDDeo.js";import{B as Qe}from"./badge-OOYS7ox8.js";import{P as Ye,a as Ze,b as Pe}from"./popover-CWcu33yS.js";import{t as ie}from"./index-q8lzB8Tn.js";import{S as es}from"./skeleton-BM9JAt9Z.js";import{S as ss}from"./share-2-CKbAbRjO.js";import{F as de}from"./file-text-ZIm8Me-N.js";import{F as me}from"./file-json-CBOsNMHR.js";import{C as ts}from"./copy-BYVWoPMP.js";import{P as he}from"./printer-Bf11cd68.js";import{T as ls}from"./trash-2-C6bUCbz1.js";import{c as O}from"./createLucideIcon-DV9StWnM.js";import{D as rs}from"./download-CPY3cAX4.js";import{P as os}from"./plus-DHmSJ9Ej.js";import{X as cs}from"./x-Cu70FuQ4.js";import{A as as,a as ns}from"./arrow-up-ftm_o6la.js";import{A as is}from"./arrow-up-down-DibDNY1b.js";import{C as ds}from"./circle-alert-DbZArJmq.js";import{C as ms}from"./chevron-left-BlVDFTUH.js";import{C as hs}from"./chevron-right-DPdqOnta.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=[["path",{d:"m11 17-5-5 5-5",key:"13zhaf"}],["path",{d:"m18 17-5-5 5-5",key:"h8a8et"}]],xs=O("ChevronsLeft",us);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=[["path",{d:"m6 17 5-5-5-5",key:"xnjwq"}],["path",{d:"m13 17 5-5-5-5",key:"17xmmf"}]],fs=O("ChevronsRight",ps);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const js=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],ws=O("EyeOff",js);function qs({columns:u,data:U,searchPlaceholder:ue="Search...",searchColumns:xe=["name"],showSearch:pe=!0,showExport:fe=!0,showFilters:je=!0,showPagination:we=!0,showPrint:A=!0,showBulkActions:ge=!0,bulkActions:be=[],onBulkDelete:E,onBulkArchive:gs,resetSelection:bs=!1,pagination:r,onPageChange:m,onSortChange:S,onSearchChange:R,onPerPageChange:k,isLoading:F=!1,error:L,tableName:f="Items",printConfig:I,onPrint:B,onExport:z}){var ee,se;console.log("DataTable render",{tableName:f,dataLength:U.length,pagination:r,isLoading:F,error:L});const[j,ve]=a.useState([]),[G,M]=a.useState([]),[d,$]=a.useState(""),[J,ye]=a.useState({}),[H,Ce]=a.useState({}),[w,W]=a.useState(""),[y,q]=a.useState(""),[X,K]=a.useState([]),[Ne,Q]=a.useState(!1),Se=a.useRef(null),C=a.useRef(!0),Y=a.useRef(d);a.useEffect(()=>{const t=new URLSearchParams(window.location.search).get("search");t!==null&&t!==d&&$(t)},[window.location.search]);const Re=a.useMemo(()=>({sorting:j,columnFilters:G,globalFilter:d,columnVisibility:J,rowSelection:H,pagination:{pageIndex:((r==null?void 0:r.current_page)??1)-1,pageSize:(r==null?void 0:r.per_page)??10}}),[j,G,d,J,H,r]),ke=a.useCallback(s=>{console.log("Sorting changed",{updater:s}),ve(s)},[]),Fe=a.useCallback(s=>{console.log("Column filters changed",{updater:s}),M(s)},[]),Le=a.useCallback(s=>{console.log("Column visibility changed",{updater:s}),ye(s)},[]),Me=a.useCallback(s=>{console.log("Row selection changed",{updater:s}),Ce(s)},[]),$e=a.useCallback(s=>{console.log("Global filter changed",{value:s,currentFilter:d}),s!==d&&(s.trim()||d.trim())&&(Y.current=d,$(s))},[d]);a.useEffect(()=>{if(d===void 0||!R)return;if(C.current){C.current=!1;return}if(!d.trim()||d===Y.current)return;console.log("Search effect triggered",{globalFilter:d});const s=setTimeout(()=>{R(d)},500);return()=>clearTimeout(s)},[d,R]),a.useEffect(()=>{if(j.length===0||!S)return;if(C.current){C.current=!1;return}console.log("Sort effect triggered",{sorting:j});const s=setTimeout(()=>{S(j[0].id,j[0].desc?"desc":"asc")},100);return()=>clearTimeout(s)},[j,S]);const h=Ie({data:U,columns:u,getCoreRowModel:Je(),getPaginationRowModel:Ge(),onSortingChange:ke,getSortedRowModel:ze(),onColumnFiltersChange:Fe,getFilteredRowModel:Be(),onColumnVisibilityChange:Le,onRowSelectionChange:Me,state:Re,onGlobalFilterChange:$e,globalFilterFn:(s,t,l)=>{const c=xe,o=String(s.getValue(t)).toLowerCase();return c.includes(t)&&o.includes(l.toLowerCase())},filterFns:{fuzzy:(s,t,l)=>String(s.getValue(t)).toLowerCase().includes(l.toLowerCase())},columnResizeMode:"onChange",filterFromLeafRows:!0,enableColumnFilters:!0,enableFilters:!0,manualPagination:!0,pageCount:(r==null?void 0:r.last_page)??1}),_e=()=>{if(w&&y&&u.find(t=>t.id===w)){const t={id:Date.now().toString(),column:w,value:y};K(l=>[...l,t]),M(l=>[...l,{id:w,value:y}]),W(""),q(""),Q(!1)}},Ve=s=>{const t=X.find(l=>l.id===s);t&&(K(l=>l.filter(c=>c.id!==s)),M(l=>l.filter(c=>c.id!==t.column)))},Z=async s=>{try{const t=z?await z(s):null;if(!t)return;if(t.format==="csv"){const{headers:l,data:c,filename:o}=t,n=[l==null?void 0:l.join(","),...c.map(Ae=>Object.values(Ae).map(Ee=>`"${String(Ee).replace(/"/g,'""')}"`).join(","))].join(`
`),i=new Blob([n],{type:"text/csv;charset=utf-8;"}),b=window.URL.createObjectURL(i),g=document.createElement("a");g.href=b,g.download=o,document.body.appendChild(g),g.click(),window.URL.revokeObjectURL(b),document.body.removeChild(g)}else if(t.format==="json"){const{data:l,filename:c}=t,o=new Blob([JSON.stringify(l,null,2)],{type:"application/json"}),n=window.URL.createObjectURL(o),i=document.createElement("a");i.href=n,i.download=c,document.body.appendChild(i),i.click(),window.URL.revokeObjectURL(n),document.body.removeChild(i)}}catch(t){console.error("Export failed:",t)}},Te=()=>{const s=h.getSelectedRowModel().rows.map(l=>l.original),t=JSON.stringify(s,null,2);navigator.clipboard.writeText(t).then(()=>{ie.success(`Copied ${s.length} item(s) to clipboard`)}).catch(()=>{ie.error("Failed to copy to clipboard")})},De=async()=>{try{const s=B?await B():[],t=window.open("","_blank");if(!t){console.error("Please allow popups to print the table");return}const l={title:`${f} List`,columns:u.map(o=>({header:String(o.header),accessor:o.id||"",format:n=>String(n)}))},c=I||l;t.document.write(`
                <html>
                    <head>
                        <title>${c.title}</title>
                        <style>
                            @media print {
                                @page {
                                    size: landscape;
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f2f2f2;
                                }
                                img {
                                    max-width: 100px;
                                    max-height: 100px;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${c.title}</h1>
                        <table>
                            <thead>
                                <tr>
                                    ${c.columns.map(o=>`<th>${o.header}</th>`).join("")}
                                </tr>
                            </thead>
                            <tbody>
                                ${s.map(o=>`
                                    <tr>
                                        ${c.columns.map(n=>{const i=o[n.accessor];return`<td>${n.format?n.format(i):String(i)}</td>`}).join("")}
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </body>
                </html>
            `),t.document.close(),t.focus(),t.print(),t.close()}catch(s){console.error("Print failed:",s)}},Oe=()=>{const s=h.getSelectedRowModel().rows.map(t=>t.original);E&&E(s)},P=async s=>{try{const t=h.getSelectedRowModel().rows.map(l=>l.original);if(t.length===0){console.error("No rows selected");return}if(s==="csv"){const c=[Object.keys(t[0]).join(","),...t.map(b=>Object.values(b).map(g=>`"${String(g).replace(/"/g,'""')}"`).join(","))].join(`
`),o=new Blob([c],{type:"text/csv;charset=utf-8;"}),n=window.URL.createObjectURL(o),i=document.createElement("a");i.href=n,i.download=`selected-${f.toLowerCase()}-${new Date().toISOString()}.csv`,document.body.appendChild(i),i.click(),window.URL.revokeObjectURL(n),document.body.removeChild(i)}else if(s==="json"){const l=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),c=window.URL.createObjectURL(l),o=document.createElement("a");o.href=c,o.download=`selected-${f.toLowerCase()}-${new Date().toISOString()}.json`,document.body.appendChild(o),o.click(),window.URL.revokeObjectURL(c),document.body.removeChild(o)}}catch(t){console.error("Bulk export failed:",t)}},Ue=async()=>{try{const s=h.getSelectedRowModel().rows.map(o=>o.original);if(s.length===0){console.error("No rows selected");return}const t=window.open("","_blank");if(!t){console.error("Please allow popups to print the table");return}const l={title:`Selected ${f} List`,columns:u.map(o=>({header:String(o.header),accessor:o.id||"",format:n=>String(n)}))},c=I||l;t.document.write(`
                <html>
                    <head>
                        <title>${c.title}</title>
                        <style>
                            @media print {
                                @page {
                                    size: landscape;
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f2f2f2;
                                }
                                img {
                                    max-width: 100px;
                                    max-height: 100px;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${c.title}</h1>
                        <table>
                            <thead>
                                <tr>
                                    ${c.columns.map(o=>`<th>${o.header}</th>`).join("")}
                                </tr>
                            </thead>
                            <tbody>
                                ${s.map(o=>`
                                    <tr>
                                        ${c.columns.map(n=>{const i=o[n.accessor];return`<td>${n.format?n.format(i):String(i)}</td>`}).join("")}
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </body>
                </html>
            `),t.document.close(),t.focus(),t.print(),t.close()}catch(s){console.error("Bulk print failed:",s)}};return e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-4 py-4",children:[e.jsxs("div",{className:"flex-1 flex items-center gap-2",children:[pe&&e.jsx(le,{ref:Se,placeholder:ue,value:d??"",onChange:s=>$(s.target.value),className:"w-full",disabled:F}),ge&&h.getSelectedRowModel().rows.length>0&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(_,{children:[e.jsx(V,{asChild:!0,children:e.jsxs(x,{variant:"outline",size:"sm",children:[e.jsx(ss,{className:"mr-2 h-4 w-4"}),"Bulk Actions"]})}),e.jsxs(T,{align:"start",className:"w-[200px]",children:[e.jsxs(p,{onClick:()=>P("csv"),children:[e.jsx(de,{className:"mr-2 h-4 w-4"}),"Export as CSV"]}),e.jsxs(p,{onClick:()=>P("json"),children:[e.jsx(me,{className:"mr-2 h-4 w-4"}),"Export as JSON"]}),e.jsx(D,{}),e.jsxs(p,{onClick:Te,children:[e.jsx(ts,{className:"mr-2 h-4 w-4"}),"Copy Selected"]}),A&&e.jsxs(p,{onClick:Ue,children:[e.jsx(he,{className:"mr-2 h-4 w-4"}),"Print Selected"]}),e.jsx(D,{}),e.jsxs(p,{onClick:Oe,className:"text-red-600",children:[e.jsx(ls,{className:"mr-2 h-4 w-4"}),"Delete Selected"]})]})]}),be.map((s,t)=>e.jsxs(x,{variant:"outline",size:"sm",onClick:()=>s.action(h.getSelectedRowModel().rows.map(l=>l.original)),children:[s.icon&&e.jsx("span",{className:"mr-2",children:s.icon}),s.label]},t))]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(_,{children:[e.jsx(V,{asChild:!0,children:e.jsxs(x,{variant:"outline",size:"sm",children:[e.jsx(ws,{className:"mr-2 h-4 w-4"}),"View"]})}),e.jsx(T,{align:"end",children:h.getAllColumns().filter(s=>s.getCanHide()).map(s=>e.jsx(Ke,{className:"capitalize",checked:s.getIsVisible(),onCheckedChange:t=>s.toggleVisibility(!!t),children:s.id},s.id))})]}),fe&&e.jsxs(_,{children:[e.jsx(V,{asChild:!0,children:e.jsxs(x,{variant:"outline",size:"sm",children:[e.jsx(rs,{className:"mr-2 h-4 w-4"}),"Export"]})}),e.jsxs(T,{align:"end",children:[e.jsxs(p,{onClick:()=>Z("csv"),children:[e.jsx(de,{className:"mr-2 h-4 w-4"}),"Export All ",f," as CSV"]}),e.jsxs(p,{onClick:()=>Z("json"),children:[e.jsx(me,{className:"mr-2 h-4 w-4"}),"Export All ",f," as JSON"]}),A&&e.jsxs(e.Fragment,{children:[e.jsx(D,{}),e.jsxs(p,{onClick:De,children:[e.jsx(he,{className:"mr-2 h-4 w-4"}),"Print All"]})]})]})]})]})]}),je&&e.jsxs("div",{className:"flex items-center gap-2 py-2",children:[e.jsxs(Ye,{open:Ne,onOpenChange:Q,children:[e.jsx(Ze,{asChild:!0,children:e.jsxs(x,{variant:"outline",size:"sm",className:"h-8 border-dashed",children:[e.jsx(os,{className:"mr-2 h-4 w-4"}),"Add Filter"]})}),e.jsx(Pe,{className:"w-80",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium leading-none",children:"Add Filter"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Filter the table by specific columns"})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx("label",{htmlFor:"column",children:"Column"}),e.jsxs(re,{value:w,onValueChange:s=>{W(s)},children:[e.jsx(oe,{className:"col-span-2",children:e.jsx(ce,{placeholder:"Select column",children:w?(ee=u.find(s=>s.id===w))==null?void 0:ee.header:"Select column"})}),e.jsx(ae,{children:u.filter(s=>s.id!=="actions").map(s=>e.jsx(ne,{value:s.id,children:s.header},s.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx("label",{htmlFor:"value",children:"Value"}),e.jsx(le,{id:"value",value:y,onChange:s=>q(s.target.value),className:"col-span-2"})]}),e.jsx(x,{onClick:_e,children:"Add"})]})]})})]}),X.map(s=>{const t=u.find(l=>l.id===s.column);return e.jsxs(Qe,{variant:"secondary",className:"flex items-center gap-1",children:[t==null?void 0:t.header,": ",s.value,e.jsx("button",{onClick:()=>Ve(s.id),className:"ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",children:e.jsx(cs,{className:"h-3 w-3"})})]},s.id)})]}),e.jsx("div",{className:"rounded-md border",children:e.jsxs(He,{children:[e.jsx(We,{children:h.getHeaderGroups().map(s=>e.jsx(v,{children:s.headers.map(t=>e.jsx(qe,{children:t.isPlaceholder?null:e.jsxs("div",{className:"flex items-center space-x-2 cursor-pointer",onClick:t.column.getToggleSortingHandler(),children:[te(t.column.columnDef.header,t.getContext()),t.column.getCanSort()&&e.jsx("div",{className:"flex flex-col",children:t.column.getIsSorted()==="asc"?e.jsx(as,{className:"h-3 w-3"}):t.column.getIsSorted()==="desc"?e.jsx(ns,{className:"h-3 w-3"}):e.jsx(is,{className:"h-3 w-3"})})]})},t.id))},s.id))}),e.jsx(Xe,{children:F?e.jsx(e.Fragment,{children:Array.from({length:(r==null?void 0:r.per_page)||5}).map((s,t)=>e.jsx(v,{children:u.map((l,c)=>e.jsx(N,{children:e.jsx(es,{className:"h-6 w-full"})},`skeleton-cell-${c}`))},`skeleton-${t}`))}):L?e.jsx(v,{children:e.jsx(N,{colSpan:u.length+1,className:"h-96",children:e.jsxs("div",{className:"flex flex-col items-center justify-center h-full",children:[e.jsx(ds,{className:"w-16 h-16 text-destructive"}),e.jsx("p",{className:"mt-4 text-sm text-destructive",children:L})]})})}):(se=h.getRowModel().rows)!=null&&se.length?h.getRowModel().rows.map(s=>e.jsx(v,{"data-state":s.getIsSelected()&&"selected",children:s.getVisibleCells().map(t=>e.jsx(N,{children:te(t.column.columnDef.cell,t.getContext())},t.id))},s.id)):e.jsx(v,{children:e.jsx(N,{colSpan:u.length+1,className:"h-24 text-center",children:"No results."})})})]})}),we&&r&&e.jsxs("div",{className:"flex items-center justify-between px-2 py-4",children:[e.jsxs("div",{className:"flex-1 text-sm text-muted-foreground",children:[h.getFilteredSelectedRowModel().rows.length," of"," ",r.total," row(s) selected."]}),e.jsxs("div",{className:"flex items-center space-x-6 lg:space-x-8",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("p",{className:"text-sm font-medium",children:"Rows per page"}),e.jsxs(re,{value:`${r.per_page}`,onValueChange:s=>{k==null||k(Number(s))},children:[e.jsx(oe,{className:"h-8 w-[70px]",children:e.jsx(ce,{placeholder:r.per_page})}),e.jsx(ae,{side:"top",children:[5,10,20,30,40,50].map(s=>e.jsx(ne,{value:`${s}`,children:s},s))})]})]}),e.jsxs("div",{className:"flex w-[100px] items-center justify-center text-sm font-medium",children:["Page ",r.current_page," of ",r.last_page]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsxs(x,{variant:"outline",className:"hidden h-8 w-8 p-0 lg:flex",onClick:()=>m==null?void 0:m(1),disabled:r.current_page===1,children:[e.jsx("span",{className:"sr-only",children:"Go to first page"}),e.jsx(xs,{className:"h-4 w-4"})]}),e.jsxs(x,{variant:"outline",className:"h-8 w-8 p-0",onClick:()=>m==null?void 0:m(r.current_page-1),disabled:r.current_page===1,children:[e.jsx("span",{className:"sr-only",children:"Go to previous page"}),e.jsx(ms,{className:"h-4 w-4"})]}),e.jsxs(x,{variant:"outline",className:"h-8 w-8 p-0",onClick:()=>m==null?void 0:m(r.current_page+1),disabled:r.current_page===r.last_page,children:[e.jsx("span",{className:"sr-only",children:"Go to next page"}),e.jsx(hs,{className:"h-4 w-4"})]}),e.jsxs(x,{variant:"outline",className:"hidden h-8 w-8 p-0 lg:flex",onClick:()=>m==null?void 0:m(r.last_page),disabled:r.current_page===r.last_page,children:[e.jsx("span",{className:"sr-only",children:"Go to last page"}),e.jsx(fs,{className:"h-4 w-4"})]})]})]})]})]})}export{qs as D};
