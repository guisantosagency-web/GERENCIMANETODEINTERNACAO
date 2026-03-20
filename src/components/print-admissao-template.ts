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
    if (dataKey.date || dataKey.details || dataKey.details2) {
      const parts = []
      if (dataKey.date) parts.push(`Data: ${dataKey.date}`)
      if (dataKey.details) parts.push(`${dataKey.details}`)
      if (dataKey.details2) parts.push(`Disp: ${dataKey.details2}`)
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
        
        .section-title { background: #f0f0f0; text-align: left; font-weight: bold; font-size: 11px; text-transform: uppercase; padding: 4px; border: 1px solid #000; border-bottom: none; page-break-after: avoid; }
        .grid-box { border: 1px solid #000; display: table; width: 100%; margin-bottom: 15px; border-collapse: collapse; page-break-inside: avoid; }
        .grid-row { display: table-row; }
        .grid-cell { display: table-cell; border: 1px solid #000; padding: 4px; vertical-align: middle; }
        
        table { border-collapse: collapse; width: 100%; font-size: 11px; margin-bottom: 15px; page-break-inside: auto; break-inside: auto; }
        tr { page-break-inside: avoid; break-inside: avoid; }
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

        <div class="section-title">Sinais Vitais</div>
        <div class="grid-box" style="margin-bottom: 15px;">
          <div class="grid-row">
            <div class="grid-cell" style="width: 16%;"><strong>PA:</strong> ${formData.sinais_vitais?.pa || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>FC:</strong> ${formData.sinais_vitais?.fc || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>FR:</strong> ${formData.sinais_vitais?.fr || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>TAX:</strong> ${formData.sinais_vitais?.tax || ""}</div>
            <div class="grid-cell" style="width: 16%;"><strong>GLI:</strong> ${formData.sinais_vitais?.gli || ""}</div>
            <div class="grid-cell" style="width: 20%;"><strong>SPO2:</strong> ${formData.sinais_vitais?.spo2 || ""}</div>
          </div>
        </div>

        <div class="section-title" style="text-align: center;">Exame Físico Geral</div>
        <table style="margin-bottom: 0; border-bottom: none;">
          <tbody>
            <tr>
              <td style="width: 20%; font-weight: bold; vertical-align: top; background: #f9f9f9;">CABEÇA E PESCOÇO:</td>
              <td style="width: 80%;">
                Cabeça: ( ${formData.exame_fisico?.cabeca_pescoco?.cabeca === 'Inalterada' ? 'X' : ' '} ) Inalterada 
                ( ${formData.exame_fisico?.cabeca_pescoco?.cabeca === 'Alterada' ? 'X' : ' '} ) Alterada Quais: ${formData.exame_fisico?.cabeca_pescoco?.cabeca_obs || '_________________'} <br>
                Acuidade visual: ( ${formData.exame_fisico?.cabeca_pescoco?.acuid_visual === 'Preservada' ? 'X' : ' '} ) Preservada ( ${formData.exame_fisico?.cabeca_pescoco?.acuid_visual === 'Diminuída' ? 'X' : ' '} ) Diminuída<br>
                Acuidade auditiva: ( ${formData.exame_fisico?.cabeca_pescoco?.acuid_auditiva === 'Preservada' ? 'X' : ' '} ) Preservada ( ${formData.exame_fisico?.cabeca_pescoco?.acuid_auditiva === 'Diminuída' ? 'X' : ' '} ) Diminuída<br>
                Nariz e boca: ( ${formData.exame_fisico?.cabeca_pescoco?.nariz_boca === 'Inalterado' ? 'X' : ' '} ) Inalterado ( ${formData.exame_fisico?.cabeca_pescoco?.nariz_boca === 'Alterações' ? 'X' : ' '} ) Alterações Quais: ${formData.exame_fisico?.cabeca_pescoco?.nariz_boca_obs || '_________________'}<br>
                Prótese dentária: ( ${formData.exame_fisico?.cabeca_pescoco?.protese === 'Sim' ? 'X' : ' '} ) Sim ( ${formData.exame_fisico?.cabeca_pescoco?.protese === 'Não' ? 'X' : ' '} ) Não
              </td>
            </tr>
            <tr>
              <td style="font-weight: bold; vertical-align: top; background: #f9f9f9;">TÓRAX:</td>
              <td>
                Respiratório: ( ${formData.exame_fisico?.torax?.resp === 'Ar ambiente' ? 'X' : ' '} ) Ar ambiente 
                ( ${formData.exame_fisico?.torax?.resp === 'CNO2' ? 'X' : ' '} ) CNO2 ${formData.exame_fisico?.torax?.o2_lmin || '___'} L/min 
                ( ${formData.exame_fisico?.torax?.resp === 'Macronebulização' ? 'X' : ' '} ) Macronebulização 
                ( ${formData.exame_fisico?.torax?.resp === 'TQT' ? 'X' : ' '} ) TQT<br>
                ( ${formData.exame_fisico?.torax?.padrao === 'Eupneico' ? 'X' : ' '} ) Eupneico 
                ( ${formData.exame_fisico?.torax?.padrao === 'Taquipneico' ? 'X' : ' '} ) Taquipneico 
                ( ${formData.exame_fisico?.torax?.padrao === 'Bradipneico' ? 'X' : ' '} ) Bradipneico 
                ( ${formData.exame_fisico?.torax?.padrao === 'Dispneico' ? 'X' : ' '} ) Dispneico<br>
                Ausculta Pulmonar: ( ${formData.exame_fisico?.torax?.ausc_pulm === 'MV+' ? 'X' : ' '} ) MV+ 
                ( ${formData.exame_fisico?.torax?.ausc_pulm === 'MV diminuídos' ? 'X' : ' '} ) MV diminuídos 
                ( ${formData.exame_fisico?.torax?.ausc_pulm === 'Sem RA' ? 'X' : ' '} ) Sem RA<br>
                ( ${formData.exame_fisico?.torax?.ausc_pulm === 'Com RA' ? 'X' : ' '} ) Com RA: 
                ( ${formData.exame_fisico?.torax?.ra === 'Roncos' ? 'X' : ' '} ) Roncos 
                ( ${formData.exame_fisico?.torax?.ra === 'Sibilos' ? 'X' : ' '} ) Sibilos 
                ( ${formData.exame_fisico?.torax?.ra === 'Estertores' ? 'X' : ' '} ) Estertores<br>
                Ausculta Cardíaca: ( ${formData.exame_fisico?.torax?.ausc_card === 'BRNF 2T' ? 'X' : ' '} ) BRNF 2T 
                ( ${formData.exame_fisico?.torax?.ausc_card === 'Sem sopro' ? 'X' : ' '} ) Sem sopro 
                ( ${formData.exame_fisico?.torax?.ausc_card === 'Com sopro' ? 'X' : ' '} ) Com sopro<br>
                Outros: ${formData.exame_fisico?.torax?.outros || '________________________________________________'}
              </td>
            </tr>
            <tr>
              <td style="font-weight: bold; vertical-align: top; background: #f9f9f9;">ABDOME:</td>
              <td>
                Inspeção: ( ${formData.exame_fisico?.abdome?.inspecao === 'Plano' ? 'X' : ' '} ) Plano 
                ( ${formData.exame_fisico?.abdome?.inspecao === 'Escavado' ? 'X' : ' '} ) Escavado 
                ( ${formData.exame_fisico?.abdome?.inspecao === 'Globoso' ? 'X' : ' '} ) Globoso 
                ( ${formData.exame_fisico?.abdome?.inspecao === 'Distendido' ? 'X' : ' '} ) Distendido<br>
                Ausculta: ( ${formData.exame_fisico?.abdome?.ausculta === 'RHA+' ? 'X' : ' '} ) RHA+ 
                ( ${formData.exame_fisico?.abdome?.ausculta === 'RHA diminuídos' ? 'X' : ' '} ) RHA diminuídos 
                ( ${formData.exame_fisico?.abdome?.ausculta === 'Ausência' ? 'X' : ' '} ) Ausência de sons<br>
                Palpação: ( ${formData.exame_fisico?.abdome?.palpacao === 'Flácido' ? 'X' : ' '} ) Flácido 
                ( ${formData.exame_fisico?.abdome?.palpacao === 'Indolor' ? 'X' : ' '} ) Indolor 
                ( ${formData.exame_fisico?.abdome?.palpacao === 'Doloroso' ? 'X' : ' '} ) Doloroso a palpação<br>
                Obs.: ${formData.exame_fisico?.abdome?.obs || '____________________________________________________'}
              </td>
            </tr>
            <tr>
              <td style="font-weight: bold; vertical-align: top; background: #f9f9f9;">APARELHO GENITURINÁRIO / ÂNUS E RETO:</td>
              <td>
                Micção: ( ${formData.exame_fisico?.geniturinario?.miccao === 'Espontânea' ? 'X' : ' '} ) Espontânea 
                ( ${formData.exame_fisico?.geniturinario?.miccao === 'Disúria' ? 'X' : ' '} ) Disúria 
                ( ${formData.exame_fisico?.geniturinario?.miccao === 'Oligúria' ? 'X' : ' '} ) Oligúria 
                ( ${formData.exame_fisico?.geniturinario?.miccao === 'Anúria' ? 'X' : ' '} ) Anúria<br>
                ( ${formData.exame_fisico?.geniturinario?.miccao === 'Polaciúria' ? 'X' : ' '} ) Polaciúria 
                ( ${formData.exame_fisico?.geniturinario?.miccao === 'Perda' ? 'X' : ' '} ) Perda Urinária 
                ( ${formData.exame_fisico?.geniturinario?.miccao === 'SVD' ? 'X' : ' '} ) SVD<br>
                Aspecto: ( ${formData.exame_fisico?.geniturinario?.aspecto === 'Inalterado' ? 'X' : ' '} ) Inalterado 
                ( ${formData.exame_fisico?.geniturinario?.aspecto === 'Hematúria' ? 'X' : ' '} ) Hematúria 
                ( ${formData.exame_fisico?.geniturinario?.aspecto === 'Piúria' ? 'X' : ' '} ) Piúria<br>
                Obs (Lesões/Edema/Local): ${formData.exame_fisico?.geniturinario?.obs || '______________________________________'}
              </td>
            </tr>
            <tr>
              <td style="font-weight: bold; vertical-align: top; background: #f9f9f9;">MMSS e MMII:</td>
              <td>
                MMSS: ( ${formData.exame_fisico?.mmss_mmii?.mmss_dor === 'Sim' ? 'X' : ' '} ) Dor 
                ( ${formData.exame_fisico?.mmss_mmii?.mmss_edema !== '' ? 'X' : ' '} ) Edema: ${formData.exame_fisico?.mmss_mmii?.mmss_edema || '______'}/4+<br>
                MMII: ( ${formData.exame_fisico?.mmss_mmii?.mmii_dor === 'Sim' ? 'X' : ' '} ) Dor 
                ( ${formData.exame_fisico?.mmss_mmii?.mmii_edema !== '' ? 'X' : ' '} ) Edema: ${formData.exame_fisico?.mmss_mmii?.mmii_edema || '______'}/4+<br>
                AVP/Local: ${formData.exame_fisico?.mmss_mmii?.avp_local || '___________________'} | 
                CVC/Local: ${formData.exame_fisico?.mmss_mmii?.cvc_local || '___________________'}
              </td>
            </tr>
            <tr>
              <td style="font-weight: bold; vertical-align: top; background: #f9f9f9;">PELE E ANEXOS:</td>
              <td>
                Pele: ( ${formData.exame_fisico?.pele_anexos?.pele === 'Íntegra' ? 'X' : ' '} ) Íntegra 
                ( ${formData.exame_fisico?.pele_anexos?.pele !== 'Íntegra' && formData.exame_fisico?.pele_anexos?.pele !== '' ? 'X' : ' '} ) Cicatriz/Local: ${formData.exame_fisico?.pele_anexos?.cicatriz_local || '_________________'}<br>
                Coloração: ( ${formData.exame_fisico?.pele_anexos?.coloracao === 'Normocorado' ? 'X' : ' '} ) Normocorado 
                ( ${formData.exame_fisico?.pele_anexos?.coloracao === 'Palidez' ? 'X' : ' '} ) Palidez 
                ( ${formData.exame_fisico?.pele_anexos?.coloracao === 'Icterícia' ? 'X' : ' '} ) Icterícia 
                ( ${formData.exame_fisico?.pele_anexos?.coloracao === 'Cianose' ? 'X' : ' '} ) Cianose<br>
                Mucosas: ( ${formData.exame_fisico?.pele_anexos?.mucosas === 'Normocoradas' ? 'X' : ' '} ) Normocoradas 
                ( ${formData.exame_fisico?.pele_anexos?.mucosas === 'Hipocoradas' ? 'X' : ' '} ) Hipocoradas<br>
                Perfusão Periférica: ( ${formData.exame_fisico?.pele_anexos?.perfusao === 'Boa' ? 'X' : ' '} ) Boa 
                ( ${formData.exame_fisico?.pele_anexos?.perfusao === 'Ruim' ? 'X' : ' '} ) Ruim 
                ( ${formData.exame_fisico?.pele_anexos?.perfusao === 'Regular' ? 'X' : ' '} ) Regular
              </td>
            </tr>
          </tbody>
        </table>

        <!-- ESCALAS -->
        <div class="section-title" style="text-align: center; border-top: 1px solid #000; margin-top: 15px;">ESCALAS</div>
        <div class="section-title" style="text-align: center; background: #e0e0e0;">ESCALA DE MORSE FALL</div>
        <table>
          <tbody>
            <tr>
              <td><strong>Histórico de Quedas</strong></td>
              <td style="width: 50px; text-align: center;">${formData.escalas?.morse?.quedas || '0'}</td>
            </tr>
            <tr>
              <td><strong>Diagnóstico Secundário</strong></td>
              <td style="width: 50px; text-align: center;">${formData.escalas?.morse?.diag_sec || '0'}</td>
            </tr>
            <tr>
              <td><strong>Auxílio na Deambulação</strong></td>
              <td style="width: 50px; text-align: center;">${formData.escalas?.morse?.auxilio || '0'}</td>
            </tr>
            <tr>
              <td><strong>Terapia Endovenosa/D. End Sinalizado/Heparinizado</strong></td>
              <td style="width: 50px; text-align: center;">${formData.escalas?.morse?.terapia || '0'}</td>
            </tr>
            <tr>
              <td><strong>Marcha</strong></td>
              <td style="width: 50px; text-align: center;">${formData.escalas?.morse?.marcha || '0'}</td>
            </tr>
            <tr>
              <td><strong>Estado Mental</strong></td>
              <td style="width: 50px; text-align: center;">${formData.escalas?.morse?.estado_mental || '0'}</td>
            </tr>
            <tr>
              <td style="text-align: right;"><strong>TOTAL:</strong></td>
              <td style="text-align: center; font-weight: bold; font-size: 14px;">
                ${(parseInt(formData.escalas?.morse?.quedas || '0') + parseInt(formData.escalas?.morse?.diag_sec || '0') + parseInt(formData.escalas?.morse?.auxilio || '0') + parseInt(formData.escalas?.morse?.terapia || '0') + parseInt(formData.escalas?.morse?.marcha || '0') + parseInt(formData.escalas?.morse?.estado_mental || '0'))}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="font-size: 10px; text-align: center;">( ) Sem risco: 0-24 &nbsp; ( ) Baixo risco: 25-44 &nbsp; ( ) Alto risco: ≥ 45</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title" style="text-align: center; background: #e0e0e0;">ESCALA DE BRADEN</div>
        <table>
          <tbody>
            <tr>
              <td style="width: 25%; font-weight: bold;">Percepção Sensorial</td>
              <td style="width: 65%;">1. Limitado | 2. Muito Lim | 3. Leve Lim | 4. Nenhuma Limitação</td>
              <td style="width: 10%; text-align: center;">${formData.escalas?.braden?.percepcao || '0'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Umidade</td>
              <td>1. Comp molhado | 2. Muito molhado | 3. Ocasional | 4. Raramente</td>
              <td style="text-align: center;">${formData.escalas?.braden?.umidade || '0'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Atividade</td>
              <td>1. Acamado | 2. Cadeira | 3. Anda ocasional | 4. Anda frequente</td>
              <td style="text-align: center;">${formData.escalas?.braden?.atividade || '0'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Mobilidade</td>
              <td>1. Total imóvel | 2. Bastante lim | 3. Leve lim | 4. Sem limitação</td>
              <td style="text-align: center;">${formData.escalas?.braden?.mobilidade || '0'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Nutrição</td>
              <td>1. Muito pobre | 2. Inadequada | 3. Adequada | 4. Excelente</td>
              <td style="text-align: center;">${formData.escalas?.braden?.nutricao || '0'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Fricção e Cisalhamento</td>
              <td>1. Problema | 2. Problema potencial | 3. Nenhum problema</td>
              <td style="text-align: center;">${formData.escalas?.braden?.friccao || '0'}</td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: right;"><strong>TOTAL:</strong></td>
              <td style="text-align: center; font-weight: bold; font-size: 14px;">
                ${(parseInt(formData.escalas?.braden?.percepcao || '0') + parseInt(formData.escalas?.braden?.umidade || '0') + parseInt(formData.escalas?.braden?.atividade || '0') + parseInt(formData.escalas?.braden?.mobilidade || '0') + parseInt(formData.escalas?.braden?.nutricao || '0') + parseInt(formData.escalas?.braden?.friccao || '0'))}
              </td>
            </tr>
             <tr>
              <td colspan="3" style="font-size: 10px; text-align: center;">( ) Risco ≤ 12: Alto Risco &nbsp; ( ) Risco 13 a 14: Moderado &nbsp; ( ) Risco 15 a 18: Leve &nbsp; ( ) Risco ≥ 19: Sem Risco</td>
            </tr>
          </tbody>
        </table>

        <!-- EVOLUÇÃO -->
        <div class="section-title" style="text-align: center; background: #e0e0e0; margin-top: 15px;">EVOLUÇÃO DE ENFERMAGEM</div>
        <div style="min-height: 250px; font-size: 11px; line-height: 1.6; border: 1px solid #000; padding: 10px; margin-bottom: 40px; background-image: repeating-linear-gradient(transparent, transparent 19px, #ccc 20px);">
          ${formData.evolucao_enfermagem ? formData.evolucao_enfermagem.replace(/\\n/g, '<br>') : ''}
        </div>

        <div style="display: flex; justify-content: space-around; margin-top: 80px;">
           <div style="text-align: center; border-top: 1px solid #000; width: 40%; padding-top: 5px;">
              Enfermeiro<br>Assinatura e carimbo
           </div>
           <div style="text-align: center; border-top: 1px solid #000; width: 40%; padding-top: 5px;">
              Técnico de Enfermagem<br>Assinatura e carimbo
           </div>
        </div>

      </div>
    </body>
    </html>
  `
}
