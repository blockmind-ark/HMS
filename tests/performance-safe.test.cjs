const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Execute actual route handlers with synthetic Prisma responses and mocked auth.
function route(path, prisma, role, method = 'GET') {
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  const mocks = {'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status??200})}},'next-auth':{getServerSession:async()=>({user:{role}})},'@/lib/auth':{authOptions:{}},'@/lib/prisma':{prisma},'@/lib/audit':{recordAuditLog:async()=>{}},'@/lib/validations/returns':{CreateMedicineReturnSchema:{safeParse:data=>({success:true,data})}}};
  new Function('require','exports',js)(name=>{assert.ok(name in mocks,name);return mocks[name]},exports);
  return exports[method];
}
test('receptionist totals, service classification and empty sums', async()=>{
  const prisma={patient:{count:async()=>4},visit:{findMany:async q=>{assert.deepEqual(q.select,{serviceType:true});return [{serviceType:'OPD'},{serviceType:'Ultrasound'},{serviceType:'Other'}]}},invoice:{aggregate:async q=>({_sum:{totalAmount:q.where.createdAt?null:125.5}})}};
  const result=await route('src/app/api/receptionist/stats/route.ts',prisma,'RECEPTIONIST')();
  assert.deepEqual(result.body,{totalPatients:4,todayVisitsCount:3,todayRevenue:0,totalRevenue:125.5,breakdown:{opd:1,ultrasound:1,other:1}});
});
test('admin financial formulas, stock and fallback purchase price',async()=>{
  const prisma={patient:{count:async()=>2},visit:{count:async()=>3},invoice:{aggregate:async()=>({_sum:{totalAmount:100}})},pharmacySale:{findMany:async q=>{assert.ok(q.select.items.select.medicine.select.batches.select.purchasePrice);return [{totalAmount:100,items:[{quantity:2,unitPrice:20,totalPrice:40,medicine:{id:'a',name:'A',batches:[{purchasePrice:10}]}},{quantity:1,unitPrice:60,totalPrice:60,medicine:{id:'b',name:'B',batches:[]}}]}]}},approvalRequest:{count:async()=>1},drawerAdjustment:{count:async()=>2},shiftClosing:{count:async()=>3},stockBatch:{findMany:async q=>{assert.equal(q.where.approvalStatus,'APPROVED');return [{quantity:5,purchasePrice:10}]}},medicine:{findMany:async()=>[{id:'a',name:'A',threshold:5,batches:[{quantity:3}]}]}};
  const {body}=await route('src/app/api/admin/stats/route.ts',prisma,'ADMIN')();
  assert.equal(body.metrics.totalCombinedRevenue,200);
  assert.equal(body.metrics.pharmacyCOGS,56);
  assert.equal(body.metrics.pharmacyNetProfit,44);
  assert.equal(body.metrics.profitMarginPercent,'44.0');
  assert.equal(body.metrics.inventoryValuation,50);
  assert.equal(body.metrics.pendingApprovalsCount,6);
  assert.equal(body.lowStockCount,1);
  assert.equal(body.topSellingMedicines[0].name,'A');
});
test('authorization rejects unauthorized roles without database access',async()=>{
  for(const path of ['src/app/api/admin/stats/route.ts','src/app/api/receptionist/stats/route.ts']) assert.equal((await route(path,{},'DOCTOR')()).status,401);
});
test('catalogue pagination preserves legacy results, summaries and low-stock filtering',async()=>{
  const rows=[1,2,3].map(i=>({id:String(i),name:'Medicine '+i,genericName:'Medicine',category:'General',itemType:'MEDICINE',threshold:2,perOff:0,batches:[{quantity:i,purchasePrice:10,sellingPrice:20,perOff:10,batchNumber:'B'+i}]}));
  const prisma={medicine:{findMany:async q=>q.distinct?[{category:'General'}]:q.where?.AND?.[1]?.id?.in?rows.filter(r=>q.where.AND[1].id.in.includes(r.id)):rows,count:async q=>q.where.itemType==='MEDICINE'?3:0}};
  let snapshots=0;
  prisma.$transaction=async (fn,opts)=>{assert.equal(opts.isolationLevel,'RepeatableRead');snapshots++;return fn(prisma)};
  const get=route('src/app/api/pharmacist/medicines/route.ts',prisma,'PHARMACIST');
  const req=q=>({url:'http://localhost/api/pharmacist/medicines?'+q});
  const legacy=(await get(req(''))).body;
  const first=(await get(req('page=1&pageSize=2'))).body;
  const second=(await get(req('page=2&pageSize=2'))).body;
  assert.deepEqual([...first.medicines,...second.medicines],legacy.medicines);
  assert.deepEqual(first.summary,legacy.summary);
  assert.equal(first.pagination.hasNext,true);
  assert.equal(second.pagination.hasNext,false);
  assert.equal(first.medicines[0].sellingPrice,18);
  const low=(await get(req('lowStockOnly=true&page=2&pageSize=1'))).body;
  assert.equal(low.summary.totalFound,2);
  assert.equal(low.medicines[0].id,'2');
  assert.equal((await get(req('page=0'))).status,400);
  assert.equal((await get(req('pageSize=101'))).status,400);
  assert.equal(snapshots,4);
});
test('checkout rejects concurrent stock loss before creating a sale',async()=>{
  let created=false;
  const prisma={pharmacySale:{count:async()=>0,findUnique:async()=>null},$transaction:async fn=>fn({$queryRaw:async()=>[],stockBatch:{findUnique:async()=>({quantity:5,medicineId:"m",approvalStatus:"APPROVED"}),updateMany:async q=>{assert.deepEqual(q.where,{id:'batch',medicineId:'m',approvalStatus:'APPROVED',quantity:{gte:4}});return {count:0}}},pharmacySale:{count:async()=>0,findUnique:async()=>null,create:async()=>{created=true}}})};
  const post=route('src/app/api/pharmacist/pos/checkout/route.ts',prisma,'PHARMACIST','POST');
  const result=await post({json:async()=>({items:[{batchId:'batch',medicineId:'m',medicineName:'Synthetic',quantity:4,unitPrice:10}]})});
  assert.equal(result.status,500);
  assert.match(result.body.error,/stock changed/);
  assert.equal(created,false);
});
test('checkout retains existing price and discount calculations on successful deduction',async()=>{
  const prisma={pharmacySale:{count:async()=>0,findUnique:async()=>null},$transaction:async fn=>fn({$queryRaw:async()=>[],stockBatch:{findUnique:async()=>({quantity:5,medicineId:"m",approvalStatus:"APPROVED"}),updateMany:async()=>({count:1})},pharmacySale:{count:async()=>0,findUnique:async()=>null,create:async q=>({...q.data,items:q.data.items.create})}})};
  const post=route('src/app/api/pharmacist/pos/checkout/route.ts',prisma,'PHARMACIST','POST');
  const result=await post({json:async()=>({discount:3,items:[{batchId:'batch',medicineId:'m',medicineName:'Synthetic',quantity:2,unitPrice:10}]})});
  assert.equal(result.status,200);
  assert.equal(result.body.sale.totalAmount,17);
  assert.equal(result.body.sale.items[0].totalPrice,20);
});
test('invalid checkout quantities and prices rejected before database access',async()=>{
  const post=route('src/app/api/pharmacist/pos/checkout/route.ts',{},'PHARMACIST','POST');
  for(const quantity of [-1,0,1.5,2147483648]) assert.equal((await post({json:async()=>({items:[{batchId:'b',medicineId:'m',quantity,unitPrice:10}]})})).status,400);
  assert.equal((await post({json:async()=>({items:[{batchId:'b',medicineId:'m',quantity:1,unitPrice:-1}]})})).status,400);
});
test('checkout locks numbering before reads and rejects mismatched batch',async()=>{
  let locked=false;
  const prisma={$transaction:async fn=>fn({$queryRaw:async()=>{locked=true},pharmacySale:{count:async()=>{assert.ok(locked);return 0},findUnique:async()=>null},stockBatch:{findUnique:async()=>({medicineId:'other',approvalStatus:'APPROVED',quantity:10})}})};
  const post=route('src/app/api/pharmacist/pos/checkout/route.ts',prisma,'PHARMACIST','POST');
  const result=await post({json:async()=>({items:[{batchId:'b',medicineId:'m',quantity:1,unitPrice:10}]})});
  assert.match(result.body.error,/Invalid or unapproved/);
});
test('return rejects combined duplicate lines exceeding sold quantity under lock',async()=>{
  let locked=false;
  const prisma={$transaction:async fn=>fn({$queryRaw:async()=>{locked=true},pharmacySale:{findUnique:async()=>{assert.ok(locked);return {items:[{medicineId:'m',quantity:5}],returns:[{status:'PENDING_CLOSING',items:[{medicineId:'m',quantityReturned:1}]}]}}}})};
  const post=route('src/app/api/pharmacy/returns/route.ts',prisma,'PHARMACIST','POST');
  const result=await post({json:async()=>({saleId:'s',reason:'Synthetic',items:[{medicineId:'m',quantityReturned:3,unitPrice:10},{medicineId:'m',quantityReturned:2,unitPrice:10}]})});
  assert.equal(result.status,400);
  assert.match(result.body.error,/remaining returnable/);
});
