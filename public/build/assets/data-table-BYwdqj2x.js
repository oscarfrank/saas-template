import{r as a,j as e}from"./app-D_gAFq-V.js";import{u as Ie,f as te,c as Be,g as ze,b as Ge,a as Je}from"./index-C7wsa4hX.js";import{T as He,a as qe,b as y,c as We,d as Xe,e as S}from"./table-xVWD_sgs.js";import{B as p}from"./button-BFSYIwtl.js";import{I as le}from"./input-CmTb5Lxc.js";import{S as re,a as oe,b as ce,c as ae,d as ne}from"./select-CvOcG97k.js";import{D as V,a as D,b as T,d as x,e as O,g as Ze}from"./dropdown-menu-JF5QhWq2.js";import{B as Ke}from"./badge-D-wVBMaP.js";import{P as Qe,a as Ye,b as Pe}from"./popover-D2Qi_ZsX.js";import{t as ie}from"./index-LIrdw0Kx.js";import{S as es}from"./skeleton-7aYgOeLs.js";import{S as ss}from"./share-2-CbcwO1eR.js";import{F as de}from"./file-text-BK5MQnTD.js";import{c as v}from"./createLucideIcon-_LQi4Q30.js";import{C as ts}from"./copy-5VbOy5Ho.js";import{P as me}from"./printer-BjGsawVr.js";import{T as ls}from"./trash-2-BxxlJLcp.js";import{D as rs}from"./download-Bkt7M0Ag.js";import{P as os}from"./plus-DuFo3s96.js";import{X as cs}from"./x-Db-wiWVp.js";import{A as as}from"./arrow-up-down-DCalXqc6.js";import{C as ns}from"./circle-alert-fwNM582Y.js";import{C as is}from"./chevron-left-Ckng18tT.js";import{C as ds}from"./chevron-right-DBGHyw8M.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],hs=v("ArrowDown",ms);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],ps=v("ArrowUp",us);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=[["path",{d:"m11 17-5-5 5-5",key:"13zhaf"}],["path",{d:"m18 17-5-5 5-5",key:"h8a8et"}]],fs=v("ChevronsLeft",xs);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const js=[["path",{d:"m6 17 5-5-5-5",key:"xnjwq"}],["path",{d:"m13 17 5-5-5-5",key:"17xmmf"}]],ws=v("ChevronsRight",js);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],bs=v("EyeOff",gs);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1",key:"1oajmo"}],["path",{d:"M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1",key:"mpwhp6"}]],he=v("FileJson",vs);function Xs({columns:u,data:U,searchPlaceholder:ue="Search...",searchColumns:pe=["name"],showSearch:xe=!0,showExport:fe=!0,showFilters:je=!0,showPagination:we=!0,showPrint:A=!0,showBulkActions:ge=!0,bulkActions:be=[],onBulkDelete:E,onBulkArchive:ys,resetSelection:Cs=!1,pagination:r,onPageChange:m,onSortChange:k,onSearchChange:R,onPerPageChange:F,isLoading:M=!1,error:_,tableName:f="Items",printConfig:I,onPrint:B,onExport:z}){var ee,se;console.log("DataTable render",{tableName:f,dataLength:U.length,pagination:r,isLoading:M,error:_});const[j,ve]=a.useState([]),[G,$]=a.useState([]),[d,L]=a.useState(""),[J,ye]=a.useState({}),[H,Ce]=a.useState({}),[w,q]=a.useState(""),[C,W]=a.useState(""),[X,Z]=a.useState([]),[Ne,K]=a.useState(!1),Se=a.useRef(null),N=a.useRef(!0),Q=a.useRef(d);a.useEffect(()=>{const t=new URLSearchParams(window.location.search).get("search");t!==null&&t!==d&&L(t)},[window.location.search]);const ke=a.useMemo(()=>({sorting:j,columnFilters:G,globalFilter:d,columnVisibility:J,rowSelection:H,pagination:{pageIndex:((r==null?void 0:r.current_page)??1)-1,pageSize:(r==null?void 0:r.per_page)??10}}),[j,G,d,J,H,r]),Re=a.useCallback(s=>{console.log("Sorting changed",{updater:s}),ve(s)},[]),Fe=a.useCallback(s=>{console.log("Column filters changed",{updater:s}),$(s)},[]),Me=a.useCallback(s=>{console.log("Column visibility changed",{updater:s}),ye(s)},[]),_e=a.useCallback(s=>{console.log("Row selection changed",{updater:s}),Ce(s)},[]),$e=a.useCallback(s=>{console.log("Global filter changed",{value:s,currentFilter:d}),s!==d&&(s.trim()||d.trim())&&(Q.current=d,L(s))},[d]);a.useEffect(()=>{if(d===void 0||!R)return;if(N.current){N.current=!1;return}if(!d.trim()||d===Q.current)return;console.log("Search effect triggered",{globalFilter:d});const s=setTimeout(()=>{R(d)},500);return()=>clearTimeout(s)},[d,R]),a.useEffect(()=>{if(j.length===0||!k)return;if(N.current){N.current=!1;return}console.log("Sort effect triggered",{sorting:j});const s=setTimeout(()=>{k(j[0].id,j[0].desc?"desc":"asc")},100);return()=>clearTimeout(s)},[j,k]);const h=Ie({data:U,columns:u,getCoreRowModel:Je(),getPaginationRowModel:Ge(),onSortingChange:Re,getSortedRowModel:ze(),onColumnFiltersChange:Fe,getFilteredRowModel:Be(),onColumnVisibilityChange:Me,onRowSelectionChange:_e,state:ke,onGlobalFilterChange:$e,globalFilterFn:(s,t,l)=>{const c=pe,o=String(s.getValue(t)).toLowerCase();return c.includes(t)&&o.includes(l.toLowerCase())},filterFns:{fuzzy:(s,t,l)=>String(s.getValue(t)).toLowerCase().includes(l.toLowerCase())},columnResizeMode:"onChange",filterFromLeafRows:!0,enableColumnFilters:!0,enableFilters:!0,manualPagination:!0,pageCount:(r==null?void 0:r.last_page)??1}),Le=()=>{if(w&&C&&u.find(t=>t.id===w)){const t={id:Date.now().toString(),column:w,value:C};Z(l=>[...l,t]),$(l=>[...l,{id:w,value:C}]),q(""),W(""),K(!1)}},Ve=s=>{const t=X.find(l=>l.id===s);t&&(Z(l=>l.filter(c=>c.id!==s)),$(l=>l.filter(c=>c.id!==t.column)))},Y=async s=>{try{const t=z?await z(s):null;if(!t)return;if(t.format==="csv"){const{headers:l,data:c,filename:o}=t,n=[l==null?void 0:l.join(","),...c.map(Ae=>Object.values(Ae).map(Ee=>`"${String(Ee).replace(/"/g,'""')}"`).join(","))].join(`
`),i=new Blob([n],{type:"text/csv;charset=utf-8;"}),b=window.URL.createObjectURL(i),g=document.createElement("a");g.href=b,g.download=o,document.body.appendChild(g),g.click(),window.URL.revokeObjectURL(b),document.body.removeChild(g)}else if(t.format==="json"){const{data:l,filename:c}=t,o=new Blob([JSON.stringify(l,null,2)],{type:"application/json"}),n=window.URL.createObjectURL(o),i=document.createElement("a");i.href=n,i.download=c,document.body.appendChild(i),i.click(),window.URL.revokeObjectURL(n),document.body.removeChild(i)}}catch(t){console.error("Export failed:",t)}},De=()=>{const s=h.getSelectedRowModel().rows.map(l=>l.original),t=JSON.stringify(s,null,2);navigator.clipboard.writeText(t).then(()=>{ie.success(`Copied ${s.length} item(s) to clipboard`)}).catch(()=>{ie.error("Failed to copy to clipboard")})},Te=async()=>{try{const s=B?await B():[],t=window.open("","_blank");if(!t){console.error("Please allow popups to print the table");return}const l={title:`${f} List`,columns:u.map(o=>({header:String(o.header),accessor:o.id||"",format:n=>String(n)}))},c=I||l;t.document.write(`
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
            `),t.document.close(),t.focus(),t.print(),t.close()}catch(s){console.error("Bulk print failed:",s)}};return e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-4 py-4",children:[e.jsxs("div",{className:"flex-1 flex items-center gap-2",children:[xe&&e.jsx(le,{ref:Se,placeholder:ue,value:d??"",onChange:s=>L(s.target.value),className:"w-full",disabled:M}),ge&&h.getSelectedRowModel().rows.length>0&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(V,{children:[e.jsx(D,{asChild:!0,children:e.jsxs(p,{variant:"outline",size:"sm",children:[e.jsx(ss,{className:"mr-2 h-4 w-4"}),"Bulk Actions"]})}),e.jsxs(T,{align:"start",className:"w-[200px]",children:[e.jsxs(x,{onClick:()=>P("csv"),children:[e.jsx(de,{className:"mr-2 h-4 w-4"}),"Export as CSV"]}),e.jsxs(x,{onClick:()=>P("json"),children:[e.jsx(he,{className:"mr-2 h-4 w-4"}),"Export as JSON"]}),e.jsx(O,{}),e.jsxs(x,{onClick:De,children:[e.jsx(ts,{className:"mr-2 h-4 w-4"}),"Copy Selected"]}),A&&e.jsxs(x,{onClick:Ue,children:[e.jsx(me,{className:"mr-2 h-4 w-4"}),"Print Selected"]}),e.jsx(O,{}),e.jsxs(x,{onClick:Oe,className:"text-red-600",children:[e.jsx(ls,{className:"mr-2 h-4 w-4"}),"Delete Selected"]})]})]}),be.map((s,t)=>e.jsxs(p,{variant:"outline",size:"sm",onClick:()=>s.action(h.getSelectedRowModel().rows.map(l=>l.original)),children:[s.icon&&e.jsx("span",{className:"mr-2",children:s.icon}),s.label]},t))]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(V,{children:[e.jsx(D,{asChild:!0,children:e.jsxs(p,{variant:"outline",size:"sm",children:[e.jsx(bs,{className:"mr-2 h-4 w-4"}),"View"]})}),e.jsx(T,{align:"end",children:h.getAllColumns().filter(s=>s.getCanHide()).map(s=>e.jsx(Ze,{className:"capitalize",checked:s.getIsVisible(),onCheckedChange:t=>s.toggleVisibility(!!t),children:s.id},s.id))})]}),fe&&e.jsxs(V,{children:[e.jsx(D,{asChild:!0,children:e.jsxs(p,{variant:"outline",size:"sm",children:[e.jsx(rs,{className:"mr-2 h-4 w-4"}),"Export"]})}),e.jsxs(T,{align:"end",children:[e.jsxs(x,{onClick:()=>Y("csv"),children:[e.jsx(de,{className:"mr-2 h-4 w-4"}),"Export All ",f," as CSV"]}),e.jsxs(x,{onClick:()=>Y("json"),children:[e.jsx(he,{className:"mr-2 h-4 w-4"}),"Export All ",f," as JSON"]}),A&&e.jsxs(e.Fragment,{children:[e.jsx(O,{}),e.jsxs(x,{onClick:Te,children:[e.jsx(me,{className:"mr-2 h-4 w-4"}),"Print All"]})]})]})]})]})]}),je&&e.jsxs("div",{className:"flex items-center gap-2 py-2",children:[e.jsxs(Qe,{open:Ne,onOpenChange:K,children:[e.jsx(Ye,{asChild:!0,children:e.jsxs(p,{variant:"outline",size:"sm",className:"h-8 border-dashed",children:[e.jsx(os,{className:"mr-2 h-4 w-4"}),"Add Filter"]})}),e.jsx(Pe,{className:"w-80",children:e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium leading-none",children:"Add Filter"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Filter the table by specific columns"})]}),e.jsxs("div",{className:"grid gap-2",children:[e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx("label",{htmlFor:"column",children:"Column"}),e.jsxs(re,{value:w,onValueChange:s=>{q(s)},children:[e.jsx(oe,{className:"col-span-2",children:e.jsx(ce,{placeholder:"Select column",children:w?(ee=u.find(s=>s.id===w))==null?void 0:ee.header:"Select column"})}),e.jsx(ae,{children:u.filter(s=>s.id!=="actions").map(s=>e.jsx(ne,{value:s.id,children:s.header},s.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-3 items-center gap-4",children:[e.jsx("label",{htmlFor:"value",children:"Value"}),e.jsx(le,{id:"value",value:C,onChange:s=>W(s.target.value),className:"col-span-2"})]}),e.jsx(p,{onClick:Le,children:"Add"})]})]})})]}),X.map(s=>{const t=u.find(l=>l.id===s.column);return e.jsxs(Ke,{variant:"secondary",className:"flex items-center gap-1",children:[t==null?void 0:t.header,": ",s.value,e.jsx("button",{onClick:()=>Ve(s.id),className:"ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",children:e.jsx(cs,{className:"h-3 w-3"})})]},s.id)})]}),e.jsx("div",{className:"rounded-md border",children:e.jsxs(He,{children:[e.jsx(qe,{children:h.getHeaderGroups().map(s=>e.jsx(y,{children:s.headers.map(t=>e.jsx(We,{children:t.isPlaceholder?null:e.jsxs("div",{className:"flex items-center space-x-2 cursor-pointer",onClick:t.column.getToggleSortingHandler(),children:[te(t.column.columnDef.header,t.getContext()),t.column.getCanSort()&&e.jsx("div",{className:"flex flex-col",children:t.column.getIsSorted()==="asc"?e.jsx(ps,{className:"h-3 w-3"}):t.column.getIsSorted()==="desc"?e.jsx(hs,{className:"h-3 w-3"}):e.jsx(as,{className:"h-3 w-3"})})]})},t.id))},s.id))}),e.jsx(Xe,{children:M?e.jsx(e.Fragment,{children:Array.from({length:(r==null?void 0:r.per_page)||5}).map((s,t)=>e.jsx(y,{children:u.map((l,c)=>e.jsx(S,{children:e.jsx(es,{className:"h-6 w-full"})},`skeleton-cell-${c}`))},`skeleton-${t}`))}):_?e.jsx(y,{children:e.jsx(S,{colSpan:u.length+1,className:"h-96",children:e.jsxs("div",{className:"flex flex-col items-center justify-center h-full",children:[e.jsx(ns,{className:"w-16 h-16 text-destructive"}),e.jsx("p",{className:"mt-4 text-sm text-destructive",children:_})]})})}):(se=h.getRowModel().rows)!=null&&se.length?h.getRowModel().rows.map(s=>e.jsx(y,{"data-state":s.getIsSelected()&&"selected",children:s.getVisibleCells().map(t=>e.jsx(S,{children:te(t.column.columnDef.cell,t.getContext())},t.id))},s.id)):e.jsx(y,{children:e.jsx(S,{colSpan:u.length+1,className:"h-24 text-center",children:"No results."})})})]})}),we&&r&&e.jsxs("div",{className:"flex items-center justify-between px-2 py-4",children:[e.jsxs("div",{className:"flex-1 text-sm text-muted-foreground",children:[h.getFilteredSelectedRowModel().rows.length," of"," ",r.total," row(s) selected."]}),e.jsxs("div",{className:"flex items-center space-x-6 lg:space-x-8",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("p",{className:"text-sm font-medium",children:"Rows per page"}),e.jsxs(re,{value:`${r.per_page}`,onValueChange:s=>{F==null||F(Number(s))},children:[e.jsx(oe,{className:"h-8 w-[70px]",children:e.jsx(ce,{placeholder:r.per_page})}),e.jsx(ae,{side:"top",children:[5,10,20,30,40,50].map(s=>e.jsx(ne,{value:`${s}`,children:s},s))})]})]}),e.jsxs("div",{className:"flex w-[100px] items-center justify-center text-sm font-medium",children:["Page ",r.current_page," of ",r.last_page]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsxs(p,{variant:"outline",className:"hidden h-8 w-8 p-0 lg:flex",onClick:()=>m==null?void 0:m(1),disabled:r.current_page===1,children:[e.jsx("span",{className:"sr-only",children:"Go to first page"}),e.jsx(fs,{className:"h-4 w-4"})]}),e.jsxs(p,{variant:"outline",className:"h-8 w-8 p-0",onClick:()=>m==null?void 0:m(r.current_page-1),disabled:r.current_page===1,children:[e.jsx("span",{className:"sr-only",children:"Go to previous page"}),e.jsx(is,{className:"h-4 w-4"})]}),e.jsxs(p,{variant:"outline",className:"h-8 w-8 p-0",onClick:()=>m==null?void 0:m(r.current_page+1),disabled:r.current_page===r.last_page,children:[e.jsx("span",{className:"sr-only",children:"Go to next page"}),e.jsx(ds,{className:"h-4 w-4"})]}),e.jsxs(p,{variant:"outline",className:"hidden h-8 w-8 p-0 lg:flex",onClick:()=>m==null?void 0:m(r.last_page),disabled:r.current_page===r.last_page,children:[e.jsx("span",{className:"sr-only",children:"Go to last page"}),e.jsx(ws,{className:"h-4 w-4"})]})]})]})]})]})}export{Xs as D};
