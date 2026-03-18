export function generateAdmissaoHtml(formData: any, logos: any) {
  const hasAnyLogo = logos?.logo_hto || logos?.logo_maranhao || logos?.logo_instituto || logos?.logo_sus

  const logosHtml = hasAnyLogo
    ? `
    <div class="logos-header">
      ${logos.logo_hto ? `<img src="${logos.logo_hto}" alt="HTO" class="logo" />` : ""}
      ${logos.logo_instituto ? `<img src="${logos.logo_instituto}" alt="Instituto" class="logo" />` : ""}
      ${logos.logo_maranhao ? `<img src="${logos.logo_maranhao}" alt="Governo" class="logo" />` : ""}
      ${logos.logo_sus ? `<img src="${logos.logo_sus}" alt="SUS" class="logo" />` : ""}
    </div>
  `
    : ""

  const renderCheck = (value: string | null, target: string) => {
    return value === target ? 'X' : ''
  }

  const renderRow = (title: string, dataKey: any, detailsLabel = "Outros") => {
    const isNao = renderCheck(dataKey.checked, 'nao')
    const isSim = renderCheck(dataKey.checked, 'sim')
    let details = ""
    
    // Dispositivos might have date/details/details2
    if(dataKey.date || dataKey.details || dataKey.details2) {
       const parts = []
       if(dataKey.date) parts.push(`Data: ${dataKey.date}`)
       if(dataKey.details) parts.push(`${dataKey.details}`)
       if(dataKey.details2) parts.push(`Disp: ${dataKey.details2}`)
       details = parts.join(" | ")
    } else {
       details = dataKey.details || ""
    }

    return `
      <tr>
        <td style="font-weight:bold; padding:4px;">${title}</td>
        <td style="text-align:center;">${isNao}</td>
        <td style="text-align:center;">${isSim}</td>
        <td style="padding:4px; border-bottom: 1px dotted #999;">${details}</td>
      </tr>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admissão de Enfermagem</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', sans-serif; }
        body { background: white; color: black; font-size: 11px; }
        .page { width: 100%; padding: 5mm; }
        .logos-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .logo { max-height: 80px; max-width: 150px; object-fit: contain; }
        .title { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
        
        .section-title { background: #f0f0f0; text-align: center; font-weight: bold; font-size: 11px; text-transform: uppercase; padding: 4px; border: 1px solid #000; border-bottom: none; }
        .grid-box { border: 1px solid #000; display: table; width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .grid-row { display: table-row; }
        .grid-cell { display: table-cell; border: 1px solid #000; padding: 4px; vertical-align: middle; }
        
        table { border-collapse: collapse; width: 100%; font-size: 11px; margin-bottom: 15px; }
        th, td { border: 1px solid #000; padding: 4px; }
        th { background: #f8f8f8; font-weight: bold; text-align: center; text-transform: uppercase;}
      </style>
    </head>
    <body>
      <div class="page">
        ${logosHtml}
        
        <div class="title">Admissão de Enfermagem</div>

        <div class="section-title">Dados do Paciente</div>
        <div class="grid-box">
          <div class="grid-row">
            <div class="grid-cell" style="width: 70%;"><strong>NOME:</strong> ${formData.patient_name || ""}</div>
            <div class="grid-cell" style="width: 30%;"><strong>Nº PRONTUÁRIO:</strong> ${formData.prontuario || ""}</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell" style="width: 70%;"><strong>NOME SOCIAL:</strong> ${formData.social_name || ""}</div>
            <div class="grid-cell" style="width: 30%;"><strong>HORA DA ADMISSÃO:</strong> ${formData.hora_admissao || ""}</div>
          </div>
        </div>
        
        <div class="grid-box">
          <div class="grid-row">
            <div class="grid-cell" style="width: 33%;"><strong>SEXO:</strong> ${formData.sexo || ""}</div>
            <div class="grid-cell" style="width: 33%;"><strong>DATA DE NASCIMENTO:</strong> ${formData.data_nascimento ? new Date(formData.data_nascimento).toLocaleDateString('pt-BR') : ""}</div>
            <div class="grid-cell" style="width: 34%;"><strong>IDADE:</strong> ${formData.idade || ""}</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell" colspan="3"><strong>DIAGNÓSTICO MÉDICO:</strong> ${formData.diagnostico_medico || ""}</div>
          </div>
          <div class="grid-row">
            <div class="grid-cell" colspan="2">
              <strong>JEJUM:</strong> 
              [ ${formData.jejum_status === 'sim' ? 'X' : ' '} ] SIM A PARTIR DE ${formData.jejum_inicio || '--:--'} H &nbsp;&nbsp;
              [ ${formData.jejum_status === 'nao' ? 'X' : ' '} ] NÃO &nbsp;&nbsp;
              [ ${formData.jejum_status === 'nao_se_aplica' ? 'X' : ' '} ] NÃO SE APLICA
            </div>
            <div class="grid-cell" style="padding: 0; border: none;">
              <div style="display:flex; width: 100%; height: 100%;">
                 <div style="width: 50%; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;"><strong>PESO:</strong> ${formData.peso || ""} kg</div>
                 <div style="width: 50%; padding: 4px;"><strong>ALTURA:</strong> ${formData.altura || ""} m</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-title">Antecedentes Pessoais</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%; text-align: left;">COMORBIDADES</th>
              <th style="width: 10%;">NÃO</th>
              <th style="width: 10%;">SIM</th>
              <th style="width: 45%; text-align: left;">MEDICAÇÃO EM USO</th>
            </tr>
          </thead>
          <tbody>
            ${renderRow("Hipertensão", formData.comorbidades?.hipertensao)}
            ${renderRow("Diabetes", formData.comorbidades?.diabetes)}
            ${renderRow("Doença Renal", formData.comorbidades?.doenca_renal)}
            ${renderRow("Dialítico", formData.comorbidades?.dialitico)}
            ${renderRow("Cardiopata", formData.comorbidades?.cardiopata)}
            ${renderRow("Doença Respiratória", formData.comorbidades?.doenca_respiratoria)}
            ${renderRow("Doença Hepática", formData.comorbidades?.doenca_hepatica)}
            ${renderRow("Convulsões", formData.comorbidades?.convulsoes)}
            ${renderRow("Câncer", formData.comorbidades?.cancer)}
            ${renderRow("Cateterismo prévio", formData.comorbidades?.cateterismo)}
            ${renderRow("Cirurgias", formData.comorbidades?.cirurgias)}
            ${renderRow("Alergias", formData.comorbidades?.alergias)}
            ${renderRow("Outras", formData.comorbidades?.outras)}
          </tbody>
        </table>

        <div class="section-title">Medicações de Uso Contínuo</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%; text-align: left;">MEDICAMENTOS</th>
              <th style="width: 10%;">NÃO</th>
              <th style="width: 10%;">SIM</th>
              <th style="width: 45%; text-align: left;">QUAL?</th>
            </tr>
          </thead>
          <tbody>
            ${renderRow("Anticoagulantes", formData.medicacoes_continuas?.anticoagulantes)}
            ${renderRow("Outros", formData.medicacoes_continuas?.outros)}
          </tbody>
        </table>

        <div class="section-title">Histórico Familiar</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%; text-align: left;">COMORBIDADES</th>
              <th style="width: 10%;">NÃO</th>
              <th style="width: 10%;">SIM</th>
              <th style="width: 45%; text-align: left;">QUEM NA FAMÍLIA?</th>
            </tr>
          </thead>
          <tbody>
            ${renderRow("Hipertensão", formData.historico_familiar?.hipertensao)}
            ${renderRow("Diabetes", formData.historico_familiar?.diabetes)}
            ${renderRow("Cardiopatia", formData.historico_familiar?.cardiopatia)}
            ${renderRow("Câncer", formData.historico_familiar?.cancer)}
            ${renderRow("Outras", formData.historico_familiar?.outras)}
          </tbody>
        </table>

         <div class="section-title">Hábitos de Vida</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%; text-align: left;">HÁBITO</th>
              <th style="width: 10%;">NÃO</th>
              <th style="width: 10%;">SIM</th>
              <th style="width: 45%; text-align: left;">QUANTO TEMPO?</th>
            </tr>
          </thead>
          <tbody>
            ${renderRow("Tabagista", formData.habitos_vida?.tabagista)}
            ${renderRow("Etilista", formData.habitos_vida?.etilista)}
            ${renderRow("Drogas", formData.habitos_vida?.drogas)}
          </tbody>
        </table>

        <div class="section-title">Dispositivos</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%; text-align: left;">TIPO</th>
              <th style="width: 10%;">NÃO</th>
              <th style="width: 10%;">SIM</th>
              <th style="width: 45%; text-align: left;">DATA / OBSERVAÇÕES</th>
            </tr>
          </thead>
          <tbody>
            ${renderRow("Punção Venosa", formData.dispositivos?.puncao_venosa)}
            ${renderRow("Sonda Vesical", formData.dispositivos?.sonda_vesical)}
            ${renderRow("Sonda Gástrica", formData.dispositivos?.sonda_gastrica)}
            ${renderRow("Outros", formData.dispositivos?.outros)}
          </tbody>
        </table>

        <div class="section-title">Exame Físico Geral / Sinais Vitais</div>
        <div class="grid-box" style="margin-bottom: 0;">
          <div class="grid-row">
            <div class="grid-cell" style="width: 16%;"><strong>PA:</strong> ${formData.sinais_vitais?.pa || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>FC:</strong> ${formData.sinais_vitais?.fc || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>FR:</strong> ${formData.sinais_vitais?.fr || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>TAX:</strong> ${formData.sinais_vitais?.tax || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>GLI:</strong> ${formData.sinais_vitais?.gli || ""}</div>
            <div class="grid-cell" style="width: 20%;"><strong>SPO2:</strong> ${formData.sinais_vitais?.spo2 || ""}</div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `
}
