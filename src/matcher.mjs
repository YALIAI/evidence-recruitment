// Deterministic browser-only evidence retrieval. No model, network or storage.
const definitions = [
 ['C++',['c++','c plus plus']],['C#',['c#','c sharp']],['Python',['python']],['Java',['java']],['JavaScript',['javascript']],['TypeScript',['typescript']],
 ['Linux',['linux','ubuntu']],['Git',['git']],['Docker',['docker']],['SQL',['sql','postgresql','mysql']],['React',['react','reactjs']],
 ['ROS 2',['ros 2','ros2']],['ROS',['ros']],['CARLA',['carla']],['PyTorch',['pytorch']],['TensorFlow',['tensorflow']],
 ['Deep learning',['deep learning','neural network','neural networks']],['Machine learning',['machine learning']],
 ['Computer vision',['computer vision']],['LiDAR',['lidar','laser scanning']],['Radar',['radar']],['Camera',['camera','cameras']],
 ['Sensor fusion',['sensor fusion','multi-sensor fusion','multisensor fusion']],['Object detection',['object detection']],['Segmentation',['segmentation']],
 ['Tracking',['object tracking','multi-object tracking','target tracking']],['Kalman filter',['kalman filter','ekf']],['SLAM',['slam']],
 ['CAN',['can bus','can-bus']],['CANoe',['canoe']],['CANalyzer',['canalyzer']],['SystemWeaver',['systemweaver']],['XCP',['xcp']],
 ['ISO 26262',['iso 26262']],['SOTIF',['sotif','iso 21448']],['Euro NCAP',['euro ncap','euroncap']],
 ['AWS',['aws','amazon web services']],['Azure',['azure']],['Power BI',['power bi','powerbi']],['Tableau',['tableau']],
 ['Real-time',['real-time','real time']],['Model deployment',['model deployment','deploy the model','deployed models']],
 ['Performance optimization',['performance optimization','performance optimisation']],['Teamwork',['teamwork','collaborated','collaboration']]
];
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const contains=(text,alias)=>new RegExp('(^|[^a-z0-9])'+escape(alias)+'(?=$|[^a-z0-9+#])','i').test(text);
const skills=text=>definitions.filter(([,aliases])=>aliases.some(a=>contains(text,a))).map(([name])=>name);
const stop=new Set('a an the and or of to in on for with by is are be as at from experience required preferred requirements skills knowledge ability strong good relevant years year must have using used work working development engineer candidate'.split(' '));
const tokens=text=>(text.toLowerCase().match(/[a-z][a-z0-9+#-]*/g)||[]).filter(t=>!stop.has(t)&&t.length>1);
export const passages=text=>text.split(/\n+|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
function retriever(documents){
 const terms=documents.map(tokens),df=new Map();
 for(const ts of terms)for(const t of new Set(ts))df.set(t,(df.get(t)||0)+1);
 const idf=t=>Math.log((documents.length+1)/((df.get(t)||0)+1))+1;
 const vector=ts=>{const counts=new Map();for(const t of ts)counts.set(t,(counts.get(t)||0)+1);let norm=0;for(const [t,n]of counts){const w=(1+Math.log(n))*idf(t);counts.set(t,w);norm+=w*w;}return {counts,norm:Math.sqrt(norm)};};
 const vectors=terms.map(vector);
 return query=>{const q=vector(tokens(query));return documents.map((text,i)=>{const d=vectors[i];let dot=0;for(const [t,w]of q.counts)dot+=w*(d.counts.get(t)||0);return {text,score:q.norm&&d.norm?dot/(q.norm*d.norm):0};}).sort((a,b)=>b.score-a.score);};
}
export function extractRequirements(job){
 let priority='Required';const result=[];
 for(const original of passages(job)){
  let line=original.replace(/^[-*•\d.)\s]+/,'').trim();
  if(/^(preferred|desirable|nice.to.have|bonus)/i.test(line))priority='Preferred';
  else if(/^(required|requirements|qualifications|must.have)/i.test(line))priority='Required';
  line=line.replace(/^(required|requirements|qualifications|preferred|desirable|nice.to.have|bonus)\s*:\s*/i,'');
  if(!line||/^(requirements|qualifications|responsibilities|preferred|required)$/i.test(line))continue;
  const found=skills(line);
  if(found.length){for(const skill of found){if(!result.some(r=>r.skill===skill&&r.priority===priority))result.push({requirement:skill,source:line,skill,priority});}}
  else if(tokens(line).length>=3)result.push({requirement:line,source:line,skill:null,priority});
 }
 return result.slice(0,60);
}
function caution(text){return /\b(no|not|without|lack|lacking|limited|beginner|basic|learning|course|courses|coursework|familiar|exposure|tutorial)\b/i.test(text);}
export function analyzeLocal(job,candidates){
 const criteria=extractRequirements(job);
 if(!criteria.length)throw new Error('No requirements found. Use separate English requirement lines or list named technical skills.');
 const documents=candidates.flatMap(c=>passages(c.resume));const retrieve=retriever(documents);
 return candidates.map(c=>{
  const ps=passages(c.resume);
  const rows=criteria.map(r=>{
   let evidence='',status='unknown',reason='No direct skill evidence found.';
   if(r.skill){
    const hits=ps.filter(p=>skills(p).includes(r.skill));
    const direct=hits.find(p=>!caution(p));
    if(direct){evidence=direct;status='supported';reason='Named skill found. Depth, duration and the full requirement remain to be verified.';}
    else if(hits.length){evidence=hits[0];status='partial';reason='Skill mentioned in limited, learning or negative context. Verify the actual experience.';}
   }
   if(!evidence){const top=retrieve(r.source).find(x=>ps.includes(x.text));if(top&&top.score>=0.18){evidence=top.text;status='partial';reason='Related wording retrieved by TF-IDF; this does not establish qualification.';}}
   return {requirement:r.requirement,priority:r.priority,source:r.source,status,evidence,reason,question:`What concrete project demonstrates ${r.requirement}, and what was your responsibility?`};
  });
  const direct=rows.filter(r=>r.status==='supported').length;
  return {id:c.id,summary:`${direct} of ${rows.length} criteria have direct skill mentions; ${rows.filter(r=>r.status==='partial').length} need clarification. These are retrieval hints, not verified qualifications or a hiring score.`,rows};
 });
}
