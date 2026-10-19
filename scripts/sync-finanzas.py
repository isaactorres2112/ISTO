import os, json, re
from decimal import Decimal
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

SHEET = "1bExjolIgEzzBdCk2fppPy_WCNik0Z94Ca39s-To9Y6A"
expenses = ["Vivienda","Alimentos","Regalos","Servicios","Suscripciones","Vestimenta","Cuidado personal","Transporte"]
opening = {"Efectivo":420,"Banorte Nómina":7500,"Mercado Pago":2226.12,"CETES Directo":24062.77}
def amt(s):
    return Decimal(re.sub(r"[^0-9.\\-]","",str(s or "")) or "0")
def num(v):
    return round(float(v),2)
def main():
    key = os.environ["GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON"]
    credentials = service_account.Credentials.from_service_account_info(json.loads(key),scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"])
    client = AuthorizedSession(credentials)
    def rows(tab):
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET}/values/{tab}!A1:F5000"
        response = client.get(url,timeout=30)
        response.raise_for_status()
        return response.json()["values"][1:]
    deb,cred = defaultdict(Decimal),defaultdict(Decimal)
    journal=rows("Diario%20contable")
    for r in journal:
        if len(r)<4 or not r[3].strip(): continue
        account=r[3].strip()
        deb[account]+=amt(r[4] if len(r)>4 else "")
        cred[account]+=amt(r[5] if len(r)>5 else "")
    if sum(deb.values())!=sum(cred.values()):
        raise ValueError("Diario descuadrado")
    net=lambda name:deb[name]-cred[name]
    accounts=[{"nombre":name,"tipo":"Activo · "+("Inversiones" if name=="CETES Directo" else "Efectivo" if name=="Efectivo" else "Bancos"),"saldo":num(Decimal(str(start))+net(name))} for name,start in opening.items()]
    dafi=net("Cuenta por cobrar DAFI")+net("Viáticos por comprobar")
    accounts.append({"nombre":"DAFI · saldo neto","tipo":"Activo · Cuenta por cobrar neta" if dafi>=0 else "Pasivo · Saldo acreedor neto","saldo":num(dafi)})
    accounts.append({"nombre":"TC Mercado Libre","tipo":"Pasivo · Tarjeta de crédito","saldo":num(cred["TC Mercado Libre"]-deb["TC Mercado Libre"])})
    movements=[]
    for i,r in enumerate(rows("Movimientos")):
        if len(r)<4: continue
        try: date=datetime.strptime(r[0].strip(),"%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError: continue
        concept=r[1].strip()
        kind="transfer" if re.search("traspaso|transferencia|pago de tc",concept,re.I) else "income" if re.search("nómina|cobro de préstamo|reembolso",concept,re.I) else "expense"
        movements.append({"fecha":date,"concepto":concept,"nombre":r[2],"importe":num(amt(r[3])),"tipo":kind,"id":str(i+1)})
    movements.sort(key=lambda x:(x["fecha"],int(x["id"])),reverse=True)
    income=sum((cred[n]-deb[n] for n in ["Ingresos por nómina","Otros ingresos"]),Decimal(0))
    expense=sum((net(n) for n in expenses),Decimal(0))
    categories=sorted(({"nombre":n,"importe":num(net(n))} for n in expenses if net(n)>0),key=lambda x:x["importe"],reverse=True)
    today=datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data={"actualizado":datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC"),"disponible":num(sum((Decimal(str(a["saldo"])) for a in accounts[:-1]),Decimal(0))),"gasto_hoy":num(sum((Decimal(str(m["importe"])) for m in movements if m["fecha"]==today and m["tipo"]=="expense"),Decimal(0))),"gasto_mes":num(expense),"ingresos_mes":num(income),"cuentas":accounts,"movimientos":movements[:10],"categorias":categories[:5]}
    Path("app/data-finanzas.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__": main()
