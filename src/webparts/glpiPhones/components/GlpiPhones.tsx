import { Icon } from 'office-ui-fabric-react';
import * as React from 'react';
import './GlpiStyles.css';


interface State {
  id?: number,
  name?: string
}
interface Location {
  id?: number,
  name?: string,
  completename?: string;
}

interface Line {
  name?: string;
  caller_num?: string;
  groups_id?: number;
  is_deleted?: number;
  states_id?: number;
  locations_id?: number;
  state: State;
  location: Location;
}


export default function GlpiPhones() {

  // const [sessionToken, setSessionToken] = React.useState('');
  const [lines, setLines] = React.useState<Line[]>([])
  const [linesFiltered, setLinesFiltered] = React.useState<Line[]>([])
  let sessionToken: string;
  // let loading: boolean = false;
  const [loading, setLoading] = React.useState(false)
  const [accessDenied, setAccessDenied] = React.useState(false);
  const [messageDenied, setMessageDenied] = React.useState('')
  const [exception, setException] = React.useState('')

  // let timer: any;







  async function getSessionToken() {

    setAccessDenied(false);
    setException('');

    return await fetch(
      "https://glpi.bel.ind.br/glpi/apirest.php/initSession?get_full_session=true",
      {

        method: 'GET',
        headers: {
          'Authorization': 'user_token YRSzLCwiHG6Jcj5FiBMAHCLH4E5ZymrBCEPFi5Bu',
          'App-Token': '5GZazWbaTE23v3C3c4vUPs7ZanMYZ7ykAVGGFH4l',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },

      })
      .then(response => response.json())
      .catch(e => {
        setAccessDenied(true);
        setException(e);
      });



  }



  async function getState(stateId: number) {
    let data: State = await fetch(
      `https://glpi.bel.ind.br/glpi/apirest.php/State/${stateId}`,
      {

        method: 'GET',
        headers: {
          'Session-token': `${sessionToken}`,
          'App-Token': '5GZazWbaTE23v3C3c4vUPs7ZanMYZ7ykAVGGFH4l',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },

      }).then(res => res.json());
    return data;
  }
  async function getLocation(locationId: number) {

    const data = await fetch(
      `https://glpi.bel.ind.br/glpi/apirest.php/location/${locationId}`,
      {
        method: 'GET',
        headers: {
          'Session-token': `${sessionToken}`,
          'App-Token': '5GZazWbaTE23v3C3c4vUPs7ZanMYZ7ykAVGGFH4l',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },

      }).then(res => res.json())

    return data;
  }



  async function initSession() {
    localStorage.setItem("sessionToken", "consultando")
    const { session_token } = await getSessionToken();
    if (!!session_token) {


      localStorage.setItem("sessionToken", session_token)
      sessionToken = session_token;
      getLines();
    } else {
      localStorage.removeItem("sessionToken")
      setAccessDenied(true);
    }
  }


  async function getLines() {

    setAccessDenied(false);
    setException('');
    setLoading(true);
    let l: Line[] = await fetch(
      "https://glpi.bel.ind.br/glpi/apirest.php/line?range=0-900",
      {

        method: 'GET',
        headers: {
          'Session-token': `${sessionToken}`,
          'App-Token': '5GZazWbaTE23v3C3c4vUPs7ZanMYZ7ykAVGGFH4l',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },

      }).then(res => res.json())
      .catch(e => {
        setAccessDenied(true);
        setException(e);
      })

    if (!!l && l.length > 0) {

      l = l.filter(li => li.groups_id !== 120);

      await new Promise<void>((resolve, reject) => {
        l.forEach(async (li, index) => {
          let state = await getState(li.states_id);
          li.state = state;
          if (index === l.length - 1) resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        l.forEach(async (li, index) => {
          let location = await getLocation(li.locations_id);
          li.location = location;
          if (index === l.length - 1) resolve();
        });
      });
      setLines(l)
      setLinesFiltered(l)




    }

    setLoading(false);
    return;
  }



  function filter(e: any) {

    let search: string = e.target.value;
    let lis: Line[] = lines;
    if (!!search)
      lis = lis.filter(li =>
        li.name.toUpperCase().indexOf(search.toUpperCase()) > -1
        || li.caller_num.toUpperCase().indexOf(search.toUpperCase()) > -1
        || (!!li.state && li.state.name.toUpperCase().indexOf(search.toUpperCase()) > -1)
        || (!!li.location && !!li.location.completename && li.location.completename.toUpperCase().indexOf(search.toUpperCase()) > -1)
      );
    setLinesFiltered(lis);
  }



  // async function loadPhones() {
  //   await getPhones();
  // }







  React.useEffect(() => {
    setMessageDenied('Erro na requisição da API GLPI: Possíveis causas (Você não possui acesso aos endpoints da API ou o Servidor do GLPI esta offline, em quaisquer dos casos sitados entre em contato com o Administrador de infraestrutura. ');

    sessionToken = localStorage.getItem("sessionToken")
    if (!sessionToken) {
      initSession();
    } else {
      getLines();
    }

  }, [sessionToken])


  return (
    <>
      <h1><Icon iconName="CellPhone" /> Linhas Móveis Bel</h1>
      <br />
      {(loading && (<h4 className='loadInfo'><p className='loadIcon'><Icon iconName="ProgressRingDots" /></p> Consultando linhas aguarde...</h4>))}
      {(accessDenied && (<div className='accessDenied'>
        <p className='deniedIcon'><Icon iconName="ErrorBadge" /></p>
        <h4> {messageDenied} {!!exception ? ' Exception ' + exception : ''}</h4>
      </div>))}
      {(!accessDenied && !loading && (

        <>
          <div className='containerFilter'>
            <input type="text" className='cutom-input' placeholder='Digite para filtrar' onKeyUp={(e) => filter(e)} />
            <span>Exibindo {linesFiltered.length} de {lines.length} resultados.</span>
          </div>
          <div className='scrollable-div'>
            <table className='table-share'>
              <thead>
                <tr>
                  <th><Icon iconName="Tag" /> Nome</th>
                  <th><Icon iconName="NumberSymbol" /> N° Linha</th>
                  <th><Icon iconName="Plug" /> Status</th>
                  <th><Icon iconName="MapPin12" /> Localização</th>
                </tr>
              </thead>
              <tbody >
                {linesFiltered.map((l, index) =>
                  <tr className={index % 2 == 0 ? 'bg-gray' : ''}>
                    <td >{l.name}</td>
                    <td>{l.caller_num}</td>
                    <td>
                      {(!!l.state && l.state.name === "Ativo" && (<span className='connected'><Icon iconName="PlugConnected" /> </span>))}
                      {((!l.state || l.state.name === "Inativo") && (<span className='desconnected'><Icon iconName="PlugDisconnected" /></span>))}
                      - {!l.state ? '*' : l.state.name}
                    </td>
                    <td>

                      {!l.location ? '*' : l.location.completename}
                    </td>
                  </tr>)}
                {(((!linesFiltered || linesFiltered.length == 0) && !loading) && (
                  <tr>
                    <td colSpan={4} className='result-none'>
                      <Icon iconName='Search' /> 0 Resultados Encontrados
                    </td>
                  </tr>
                ))}
              </tbody>
            </table >
          </div>
          <p>Fonte - GLPI: <a href='https://glpi.bel.ind.br/glpi'> https://glpi.bel.ind.br/glpi</a></p>
        </>
      ))}
    </>
  )

}


