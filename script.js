/* =========================
   DATOS
========================= */

let citas = JSON.parse(
    localStorage.getItem("fisioCitas") || "[]"
);

let victorias = Number(
    localStorage.getItem("fisioVictorias") || 0
);

let puntos = Number(
    localStorage.getItem("fisioPuntos") || 0
);

let horaElegida = "";


/* =========================
   GUARDAR DATOS LOCALES
========================= */

function guardarDatos() {

    localStorage.setItem(
        "fisioCitas",
        JSON.stringify(citas)
    );

    localStorage.setItem(
        "fisioVictorias",
        victorias
    );

    localStorage.setItem(
        "fisioPuntos",
        puntos
    );
}


/* =========================
   ALERTA
========================= */

function mostrarAlerta(texto) {

    const alerta =
        document.getElementById("alerta");

    alerta.innerText = texto;

    alerta.classList.add("mostrar");

    setTimeout(function() {

        alerta.classList.remove("mostrar");

    }, 2500);
}


/* =========================
   NAVEGACIÓN
========================= */

function ocultarSecciones() {

    document
        .querySelectorAll(".contenido")
        .forEach(function(seccion) {

            seccion.classList.add("oculto");

        });
}


function actualizarMenu(id) {

    document
        .querySelectorAll(".menu-item")
        .forEach(function(item) {

            item.classList.remove("activo");

        });

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.classList.add("activo");

    }
}


function irInicio() {

    ocultarSecciones();

    document
        .getElementById("inicio")
        .classList.remove("oculto");

    actualizarMenu("menuInicio");

    actualizarRecordatorio();
}


function irAgendar() {

    ocultarSecciones();

    document
        .getElementById("agendar")
        .classList.remove("oculto");

    actualizarMenu("menuAgendar");

    actualizarHorarios();
}


function irCitas() {

    ocultarSecciones();

    document
        .getElementById("citas")
        .classList.remove("oculto");

    actualizarMenu("menuCitas");

    mostrarCitas();
}


function irJuegos() {

    ocultarSecciones();

    document
        .getElementById("juegos")
        .classList.remove("oculto");

    actualizarMenu("menuJuegos");

    volverMenuJuegos();

    actualizarEstadisticas();
}


/* =========================
   HISTORIAL DE PACIENTES
========================= */

async function irHistorial() {

    ocultarSecciones();

    document
        .getElementById("historial")
        .classList.remove("oculto");

    /*
       Quitamos la selección del menú inferior
       porque Historial se abre desde Inicio.
    */

    document
        .querySelectorAll(".menu-item")
        .forEach(function(item) {

            item.classList.remove("activo");

        });

    await cargarHistorialPacientes();
}


/* =========================
   HORARIOS DE CITAS
========================= */

document
    .getElementById("fecha")
    .addEventListener(
        "change",
        actualizarHorarios
    );


document
    .querySelectorAll(".hora")
    .forEach(function(hora) {

        hora.addEventListener(
            "click",
            function() {

                if (
                    hora.classList.contains("ocupada")
                ) {

                    return;
                }

                document
                    .querySelectorAll(".hora")
                    .forEach(function(h) {

                        h.classList.remove(
                            "seleccionada"
                        );

                    });

                hora.classList.add(
                    "seleccionada"
                );

                horaElegida =
                    hora.dataset.hora;
            }
        );

    });


function actualizarHorarios() {

    const fecha =
        document
            .getElementById("fecha")
            .value;

    const ocupadas =
        citas
            .filter(function(cita) {

                return (
                    cita.fecha === fecha
                );

            })
            .map(function(cita) {

                return cita.hora;

            });

    document
        .querySelectorAll(".hora")
        .forEach(function(hora) {

            const ocupada =
                ocupadas.includes(
                    hora.dataset.hora
                );

            hora.classList.toggle(
                "ocupada",
                ocupada
            );

        });
}


/* =========================
   CONFIRMAR CITA
========================= */

async function confirmarCita() {

    const nombre =
        document
            .getElementById("nombre")
            .value.trim();

    const telefono =
        document
            .getElementById("telefono")
            .value.trim();

    const fecha =
        document
            .getElementById("fecha")
            .value;

    const motivo =
        document
            .getElementById("motivo")
            .value.trim();


    if (
        !nombre ||
        !telefono ||
        !fecha ||
        !motivo
    ) {

        mostrarAlerta(
            "⚠️ Completa todos los campos."
        );

        return;
    }


    if (!horaElegida) {

        mostrarAlerta(
            "⏰ Selecciona un horario."
        );

        return;
    }


    const existe =
        citas.some(function(cita) {

            return (
                cita.fecha === fecha &&
                cita.hora === horaElegida
            );

        });


    if (existe) {

        mostrarAlerta(
            "❌ Ese horario ya está ocupado."
        );

        return;
    }


    const nuevaCita = {

        id: Date.now(),

        nombre: nombre,

        telefono: telefono,

        fecha: fecha,

        hora: horaElegida,

        motivo: motivo
    };


    /*
       Primero guardamos la cita
       en este dispositivo.
    */

    citas.push(nuevaCita);

    guardarDatos();


    /*
       Ahora también enviamos la cita
       al Firestore de FisioRecordatorio.
    */

    try {

        await db
            .collection("pacientes")
            .add({

                nombre: nombre,

                telefono: telefono,

                fecha: fecha,

                hora: horaElegida,

                motivo: motivo,

                creadoEn:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp(),

                fechaRegistro:
                    new Date()
                        .toLocaleDateString(
                            "es-PE"
                        ),

                horaRegistro:
                    new Date()
                        .toLocaleTimeString(
                            "es-PE",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
            });


        console.log(
            "✅ Paciente guardado en Firebase."
        );

    } catch (error) {

        console.error(
            "❌ Error guardando en Firebase:",
            error
        );

        mostrarAlerta(
            "⚠️ La cita se guardó en este dispositivo, pero hubo un problema al enviarla a Firebase."
        );
    }


    mostrarAlerta(
        "✅ ¡Cita agendada correctamente!"
    );


    document.getElementById(
        "nombre"
    ).value = "";

    document.getElementById(
        "telefono"
    ).value = "";

    document.getElementById(
        "fecha"
    ).value = "";

    document.getElementById(
        "motivo"
    ).value = "";


    horaElegida = "";


    document
        .querySelectorAll(".hora")
        .forEach(function(h) {

            h.classList.remove(
                "seleccionada"
            );

        });


    actualizarRecordatorio();


    setTimeout(
        irInicio,
        700
    );
}


/* =========================
   RECORDATORIO
========================= */

function actualizarRecordatorio() {

    const contenedor =
        document.getElementById(
            "recordatorioContenido"
        );


    if (citas.length === 0) {

        contenedor.innerHTML =
            "Aún no tienes ninguna cita agendada.";

        return;
    }


    const cita = citas[0];


    contenedor.innerHTML = `

        <div class="proxima">

            <b>🔔 Próxima cita</b>

            <br><br>

            👤 ${cita.nombre}

            <br>

            📅 ${formatearFecha(cita.fecha)}

            <br>

            ⏰ ${cita.hora}

            <br>

            📝 ${cita.motivo}

        </div>

    `;
}


/* =========================
   FORMATEAR FECHA
========================= */

function formatearFecha(fecha) {

    const partes =
        fecha.split("-");

    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}


/* =========================
   MOSTRAR MIS CITAS
========================= */

function mostrarCitas() {

    const lista =
        document.getElementById(
            "listaCitas"
        );


    lista.innerHTML = "";


    if (citas.length === 0) {

        lista.innerHTML = `

            <div class="tarjeta">

                <h3>
                    📅 No tienes citas
                </h3>

                <p class="subtitulo">
                    Agenda tu primera cita.
                </p>

                <button onclick="irAgendar()">
                    ➕ Agendar cita
                </button>

            </div>

        `;

        return;
    }


    citas.forEach(
        function(cita, index) {

            lista.innerHTML += `

                <div class="tarjeta cita">

                    <span class="estado">
                        ● Cita registrada
                    </span>

                    <h3>
                        🩺 Fisioterapia
                    </h3>

                    <div class="info-cita">

                        <div>
                            👤 <b>Paciente:</b>
                            ${cita.nombre}
                        </div>

                        <div>
                            📱 <b>Celular:</b>
                            ${cita.telefono}
                        </div>

                        <div>
                            👩‍⚕️ <b>Profesional:</b>
                            Gaby Lourdes Navarro Mamani
                        </div>

                        <div>
                            📅 <b>Fecha:</b>
                            ${formatearFecha(cita.fecha)}
                        </div>

                        <div>
                            ⏰ <b>Hora:</b>
                            ${cita.hora}
                        </div>

                        <div>
                            📝 <b>Motivo:</b>
                            ${cita.motivo}
                        </div>

                    </div>

                    <button
                        class="btn-rojo"
                        onclick="cancelarCita(${index})"
                    >
                        ❌ Cancelar cita
                    </button>

                </div>

            `;
        }
    );
}


/* =========================
   CANCELAR CITA
========================= */

function cancelarCita(index) {

    if (
        !confirm(
            "¿Quieres cancelar esta cita?"
        )
    ) {

        return;
    }


    citas.splice(
        index,
        1
    );


    guardarDatos();

    mostrarCitas();

    actualizarRecordatorio();


    mostrarAlerta(
        "❌ Cita cancelada."
    );
}


/* =========================
   FIREBASE:
   CARGAR HISTORIAL
========================= */

async function cargarHistorialPacientes() {

    const lista =
        document.getElementById(
            "listaHistorialPacientes"
        );


    if (!lista) {

        return;
    }


    lista.innerHTML = `

        <div class="tarjeta">

            <p class="subtitulo">
                🔄 Cargando pacientes...
            </p>

        </div>

    `;


    try {

        const resultado =
            await db
                .collection("pacientes")
                .orderBy(
                    "creadoEn",
                    "desc"
                )
                .get();


        if (resultado.empty) {

            lista.innerHTML = `

                <div class="tarjeta">

                    <h3>
                        👥 Sin pacientes todavía
                    </h3>

                    <p class="subtitulo">
                        Cuando alguien agende una cita,
                        aparecerá aquí.
                    </p>

                </div>

            `;

            return;
        }


        lista.innerHTML = "";


        resultado.forEach(
            function(documento) {

                const paciente =
                    documento.data();


                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.className =
                    "tarjeta cita";


                let fechaCita =
                    paciente.fecha || "";


                if (
                    fechaCita.includes("-")
                ) {

                    fechaCita =
                        formatearFecha(
                            fechaCita
                        );
                }


                const titulo =
                    document.createElement(
                        "h3"
                    );

                titulo.textContent =
                    "👤 " +
                    (
                        paciente.nombre ||
                        "Paciente"
                    );


                const info =
                    document.createElement(
                        "div"
                    );

                info.className =
                    "info-cita";


                const celular =
                    document.createElement(
                        "div"
                    );

                celular.textContent =
                    "📱 Celular: " +
                    (
                        paciente.telefono ||
                        "No registrado"
                    );


                const fecha =
                    document.createElement(
                        "div"
                    );

                fecha.textContent =
                    "📅 Cita: " +
                    fechaCita;


                const hora =
                    document.createElement(
                        "div"
                    );

                hora.textContent =
                    "⏰ Hora: " +
                    (
                        paciente.hora ||
                        ""
                    );


                const motivo =
                    document.createElement(
                        "div"
                    );

                motivo.textContent =
                    "📝 Motivo: " +
                    (
                        paciente.motivo ||
                        "No especificado"
                    );


                const registro =
                    document.createElement(
                        "div"
                    );

                registro.textContent =
                    "🕐 Registrado: " +
                    (
                        paciente.fechaRegistro ||
                        ""
                    ) +
                    " " +
                    (
                        paciente.horaRegistro ||
                        ""
                    );


                info.appendChild(
                    celular
                );

                info.appendChild(
                    fecha
                );

                info.appendChild(
                    hora
                );

                info.appendChild(
                    motivo
                );

                info.appendChild(
                    registro
                );


                tarjeta.appendChild(
                    titulo
                );

                tarjeta.appendChild(
                    info
                );


                lista.appendChild(
                    tarjeta
                );

            }
        );


    } catch (error) {

        console.error(
            "❌ Error cargando pacientes:",
            error
        );


        lista.innerHTML = `

            <div class="tarjeta">

                <h3>
                    ❌ No se pudo cargar el historial
                </h3>

                <p class="subtitulo">
                    Revisa la conexión con Firebase.
                </p>

            </div>

        `;
    }
}
/* =========================
   ESTADÍSTICAS
========================= */

function actualizarEstadisticas() {

    document.getElementById(
        "victorias"
    ).innerText = victorias;


    document.getElementById(
        "puntos"
    ).innerText = puntos;


    const progreso =
        Math.min(
            victorias * 10,
            100
        );


    document.getElementById(
        "barraProgreso"
    ).style.width =
        progreso + "%";
}


/* =========================
   GANAR JUEGO
========================= */

function ganarJuego() {

    victorias++;

    puntos += 100;


    guardarDatos();

    actualizarEstadisticas();


    mostrarAlerta(
        "🏆 ¡Ganaste! +100 puntos"
    );


    if (
        victorias === 1 ||
        victorias % 3 === 0
    ) {

        document.getElementById(
            "premio"
        ).style.display =
            "block";
    }
}


/* =========================
   LISTA DE JUEGOS
========================= */

const juegos = [

    "juegoTenis",

    "juegoRunner",

    "juegoReaction",

    "juegoBalance",

    "juegoBasket",

    "juegoMemory",

    "juegoStretch"

];


/* =========================
   ABRIR JUEGO
========================= */

function abrirJuego(nombre) {

    document.getElementById(
        "menuJuegos"
    ).style.display =
        "none";


    juegos.forEach(
        function(id) {

            document
                .getElementById(id)
                .classList.remove(
                    "activo"
                );

        }
    );


    const id =
        "juego" +
        nombre.charAt(0).toUpperCase() +
        nombre.slice(1);


    document
        .getElementById(id)
        .classList.add(
            "activo"
        );


    if (nombre === "tenis") {

        iniciarTenis();

    }


    if (nombre === "runner") {

        resetRunner();

    }


    if (nombre === "reaction") {

        iniciarReaction();

    }


    if (nombre === "balance") {

        resetBalance();

    }


    if (nombre === "basket") {

        resetBasket();

    }


    if (nombre === "memory") {

        iniciarMemory();

    }


    if (nombre === "stretch") {

        resetStretch();

    }
}


/* =========================
   VOLVER AL MENÚ DE JUEGOS
========================= */

function volverMenuJuegos() {

    juegos.forEach(
        function(id) {

            document
                .getElementById(id)
                .classList.remove(
                    "activo"
                );

        }
    );


    document.getElementById(
        "menuJuegos"
    ).style.display =
        "block";
}


/* =========================
   TENIS
========================= */

const canvas =
    document.getElementById(
        "tennisCanvas"
    );


const ctx =
    canvas.getContext("2d");


let pelotaX = 240;

let pelotaY = 70;

let pelotaVX = 3;

let pelotaVY = 4;

let jugadorX = 240;

let tennisPuntos = 0;

let tenisActivo = false;


/* =========================
   INICIAR TENIS
========================= */

function iniciarTenis() {

    pelotaX = 240;

    pelotaY = 70;

    pelotaVX = 3;

    pelotaVY = 4;

    jugadorX = 240;

    tennisPuntos = 0;

    tenisActivo = true;


    document.getElementById(
        "tennisScore"
    ).innerText =
        "0";


    document.getElementById(
        "tennisMessage"
    ).innerText =
        "Espera la pelota...";


    requestAnimationFrame(
        bucleTenis
    );
}


/* =========================
   BUCLE TENIS
========================= */

function bucleTenis() {

    if (!tenisActivo) {

        return;
    }


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle =
        "#43a85c";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.strokeStyle =
        "white";


    ctx.lineWidth =
        5;


    ctx.strokeRect(
        15,
        15,
        450,
        370
    );


    ctx.beginPath();


    ctx.moveTo(
        15,
        200
    );


    ctx.lineTo(
        465,
        200
    );


    ctx.stroke();


    ctx.font =
        "46px Arial";


    ctx.fillText(
        "🏃",
        jugadorX - 23,
        365
    );


    ctx.beginPath();


    ctx.arc(
        pelotaX,
        pelotaY,
        11,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#eaff28";


    ctx.fill();


    pelotaX += pelotaVX;

    pelotaY += pelotaVY;


    if (
        pelotaX < 20 ||
        pelotaX > 460
    ) {

        pelotaVX *= -1;
    }


    if (
        pelotaY < 25
    ) {

        pelotaVY =
            Math.abs(
                pelotaVY
            );
    }


    if (
        pelotaY > 350
    ) {

        tenisActivo =
            false;


        document.getElementById(
            "tennisMessage"
        ).innerText =
            "❌ Fallaste. Inténtalo nuevamente.";


        return;
    }


    requestAnimationFrame(
        bucleTenis
    );
}


/* =========================
   MOVER JUGADOR TENIS
========================= */

canvas.addEventListener(
    "pointermove",
    function(e) {

        const rect =
            canvas
                .getBoundingClientRect();


        jugadorX =
            (
                e.clientX -
                rect.left
            ) *
            (
                canvas.width /
                rect.width
            );

    }
);


/* =========================
   GOLPEAR PELOTA
========================= */

function golpearPelota() {

    if (!tenisActivo) {

        return;
    }


    const distancia =
        Math.abs(
            pelotaX -
            jugadorX
        );


    if (
        pelotaY > 275 &&
        distancia < 80
    ) {

        tennisPuntos++;


        document.getElementById(
            "tennisScore"
        ).innerText =
            tennisPuntos;


        pelotaVY =
            -Math.abs(
                pelotaVY
            );


        pelotaY =
            275;


        document.getElementById(
            "tennisMessage"
        ).innerText =
            "🔥 ¡Buen golpe!";


        if (
            tennisPuntos >= 10
        ) {

            tenisActivo =
                false;


            document.getElementById(
                "tennisMessage"
            ).innerText =
                "🏆 ¡GANASTE!";


            ganarJuego();
        }


    } else {

        document.getElementById(
            "tennisMessage"
        ).innerText =
            "😬 ¡Fallaste!";
    }
}


/* =========================
   RUNNER
========================= */

let runnerPuntos = 0;

let saltando = false;


/* =========================
   REINICIAR RUNNER
========================= */

function resetRunner() {

    runnerPuntos =
        0;

    saltando =
        false;


    document.getElementById(
        "runnerScore"
    ).innerText =
        "0 / 10";


    document.getElementById(
        "runnerPlayer"
    ).style.bottom =
        "70px";


    document.getElementById(
        "runnerMessage"
    ).innerText =
        "¡Prepárate!";
}


/* =========================
   SALTAR
========================= */

function saltar() {

    if (
        saltando ||
        runnerPuntos >= 10
    ) {

        return;
    }


    saltando =
        true;


    const jugador =
        document.getElementById(
            "runnerPlayer"
        );


    jugador.style.bottom =
        "175px";


    setTimeout(
        function() {

            jugador.style.bottom =
                "70px";

            saltando =
                false;

        },
        450
    );


    runnerPuntos++;


    document.getElementById(
        "runnerScore"
    ).innerText =
        runnerPuntos +
        " / 10";


    if (
        runnerPuntos >= 10
    ) {

        document.getElementById(
            "runnerMessage"
        ).innerText =
            "🏆 ¡CARRERA COMPLETADA!";


        ganarJuego();


    } else {

        document.getElementById(
            "runnerMessage"
        ).innerText =
            "🔥 ¡Obstáculo superado!";
    }
}


/* =========================
   REACTION
========================= */

let reactionPuntos = 0;

let reactionTimer;

let reactionInicio = 0;


/* =========================
   INICIAR REACTION
========================= */

function iniciarReaction() {

    reactionPuntos =
        0;


    document.getElementById(
        "reactionScore"
    ).innerText =
        "0 / 10";


    document.getElementById(
        "reactionMessage"
    ).innerText =
        "⚡ ¡Toca el objetivo!";


    siguienteObjetivo();
}


/* =========================
   SIGUIENTE OBJETIVO
========================= */

function siguienteObjetivo() {

    const target =
        document.getElementById(
            "target"
        );


    const area =
        document.getElementById(
            "reactionArea"
        );


    target.style.display =
        "block";


    target.style.left =
        Math.random() *
        (
            area.clientWidth -
            70
        ) +
        "px";


    target.style.top =
        Math.random() *
        (
            area.clientHeight -
            70
        ) +
        "px";


    reactionInicio =
        performance.now();


    clearTimeout(
        reactionTimer
    );


    reactionTimer =
        setTimeout(
            function() {

                target.style.display =
                    "none";


                document.getElementById(
                    "reactionMessage"
                ).innerText =
                    "⏱️ ¡Muy lento!";

            },
            1800
        );
}


/* =========================
   TOCAR OBJETIVO
========================= */

document
    .getElementById("target")
    .addEventListener(
        "pointerdown",
        function() {

            clearTimeout(
                reactionTimer
            );


            reactionPuntos++;


            this.style.display =
                "none";


            document.getElementById(
                "reactionScore"
            ).innerText =
                reactionPuntos +
                " / 10";


            if (
                reactionPuntos >= 10
            ) {

                document.getElementById(
                    "reactionMessage"
                ).innerText =
                    "🏆 ¡REFLEJOS INCREÍBLES!";


                ganarJuego();


            } else {

                setTimeout(
                    siguienteObjetivo,
                    250
                );
            }

        }
    );
    /* =========================
   BALANCE
========================= */

let balancePuntos = 0;
let balancePos = 50;


function resetBalance() {

    balancePuntos = 0;
    balancePos = 50;

    document.getElementById(
        "balancePlayer"
    ).style.left = "45%";

    document.getElementById(
        "balanceScore"
    ).innerText = "0 / 15";

    document.getElementById(
        "balanceMessage"
    ).innerText =
        "¡Mantén el equilibrio!";
}


function moverBalance(direccion) {

    if (balancePuntos >= 15) {
        return;
    }

    balancePos +=
        direccion * 5;

    balancePos =
        Math.max(
            15,
            Math.min(
                85,
                balancePos
            )
        );

    document.getElementById(
        "balancePlayer"
    ).style.left =
        balancePos + "%";

    balancePuntos++;

    document.getElementById(
        "balanceScore"
    ).innerText =
        balancePuntos +
        " / 15";

    if (balancePuntos >= 15) {

        document.getElementById(
            "balanceMessage"
        ).innerText =
            "🏆 ¡EQUILIBRIO PERFECTO!";

        ganarJuego();

    } else {

        document.getElementById(
            "balanceMessage"
        ).innerText =
            "✅ ¡Muy bien!";
    }
}


/* =========================
   BASKET
========================= */

let basketPuntos = 0;

let potencia = 0;

let potenciaDireccion = 1;


/* Barra de potencia */

setInterval(
    function() {

        potencia +=
            potenciaDireccion * 5;


        if (potencia >= 100) {

            potencia = 100;

            potenciaDireccion = -1;
        }


        if (potencia <= 0) {

            potencia = 0;

            potenciaDireccion = 1;
        }


        const powerText =
            document.getElementById(
                "powerText"
            );


        if (powerText) {

            powerText.innerText =
                potencia + "%";
        }

    },
    80
);


function resetBasket() {

    basketPuntos = 0;

    document.getElementById(
        "basketScore"
    ).innerText =
        "0 / 5";

    document.getElementById(
        "basketMessage"
    ).innerText =
        "Busca la potencia perfecta.";
}


function lanzarBasket() {

    if (basketPuntos >= 5) {
        return;
    }


    const pelota =
        document.getElementById(
            "basketBall"
        );


    if (
        potencia >= 65 &&
        potencia <= 80
    ) {

        basketPuntos++;


        document.getElementById(
            "basketScore"
        ).innerText =
            basketPuntos +
            " / 5";


        pelota.style.bottom =
            "250px";

        pelota.style.left =
            "70%";


        setTimeout(
            function() {

                pelota.style.bottom =
                    "30px";

                pelota.style.left =
                    "45%";

            },
            700
        );


        document.getElementById(
            "basketMessage"
        ).innerText =
            "🏀 ¡CANASTA!";


        if (basketPuntos >= 5) {

            document.getElementById(
                "basketMessage"
            ).innerText =
                "🏆 ¡5 DE 5!";

            ganarJuego();
        }


    } else {

        document.getElementById(
            "basketMessage"
        ).innerText =
            "❌ Prueba con 65%-80%.";
    }
}


/* =========================
   MEMORY
========================= */

const valoresMemory = [

    "🦵", "🦵",

    "💪", "💪",

    "🏃", "🏃",

    "🧘", "🧘",

    "🧠", "🧠",

    "🫀", "🫀"

];


let primera = null;

let segunda = null;

let bloqueado = false;

let parejas = 0;


function iniciarMemory() {

    const board =
        document.getElementById(
            "memoryBoard"
        );


    board.innerHTML = "";

    primera = null;

    segunda = null;

    bloqueado = false;

    parejas = 0;


    document.getElementById(
        "memoryScore"
    ).innerText =
        "0 / 6";


    document.getElementById(
        "memoryMessage"
    ).innerText =
        "Encuentra las parejas.";


    let cartas =
        [...valoresMemory];


    cartas.sort(
        function() {

            return (
                Math.random() - 0.5
            );
        }
    );


    cartas.forEach(
        function(valor) {

            const carta =
                document.createElement(
                    "button"
                );


            carta.className =
                "memory-card";


            carta.innerText =
                "❔";


            carta.dataset.valor =
                valor;


            carta.onclick =
                function() {

                    voltearCarta(
                        carta
                    );

                };


            board.appendChild(
                carta
            );

        }
    );
}


function voltearCarta(carta) {

    if (
        bloqueado ||
        carta === primera ||
        carta.classList.contains(
            "abierta"
        )
    ) {

        return;
    }


    carta.classList.add(
        "abierta"
    );


    carta.innerText =
        carta.dataset.valor;


    if (!primera) {

        primera =
            carta;

        return;
    }


    segunda =
        carta;


    bloqueado =
        true;


    if (
        primera.dataset.valor ===
        segunda.dataset.valor
    ) {

        parejas++;


        document.getElementById(
            "memoryScore"
        ).innerText =
            parejas +
            " / 6";


        primera =
            null;

        segunda =
            null;

        bloqueado =
            false;


        if (parejas === 6) {

            document.getElementById(
                "memoryMessage"
            ).innerText =
                "🏆 ¡MEMORIA COMPLETADA!";

            ganarJuego();
        }


    } else {

        setTimeout(
            function() {

                primera.classList.remove(
                    "abierta"
                );

                segunda.classList.remove(
                    "abierta"
                );


                primera.innerText =
                    "❔";

                segunda.innerText =
                    "❔";


                primera =
                    null;

                segunda =
                    null;

                bloqueado =
                    false;

            },
            700
        );
    }
}


/* =========================
   STRETCH
========================= */

let stretchPuntos = 0;


const ejercicios = [

    [
        "🙆",
        "Elevación de brazos",
        "Activa hombros y brazos."
    ],

    [
        "🦵",
        "Estiramiento de piernas",
        "Trabaja la movilidad."
    ],

    [
        "🤸",
        "Movilidad de espalda",
        "Realiza un movimiento suave."
    ],

    [
        "🧘",
        "Postura de equilibrio",
        "Mantén una postura estable."
    ],

    [
        "💪",
        "Activación muscular",
        "Prepara los músculos."
    ],

    [
        "🏃",
        "Movimiento final",
        "Completa la rutina."
    ]

];


function resetStretch() {

    stretchPuntos = 0;


    document.getElementById(
        "stretchScore"
    ).innerText =
        "0 / 6";


    document.getElementById(
        "exerciseIcon"
    ).innerText =
        "🙆";


    document.getElementById(
        "exerciseName"
    ).innerText =
        "Elevación de brazos";


    document.getElementById(
        "exerciseDescription"
    ).innerText =
        "Activa hombros y brazos.";


    document.getElementById(
        "stretchMessage"
    ).innerText =
        "Comienza la rutina.";
}


function completarEjercicio() {

    if (stretchPuntos >= 6) {

        return;
    }


    stretchPuntos++;


    document.getElementById(
        "stretchScore"
    ).innerText =
        stretchPuntos +
        " / 6";


    if (stretchPuntos < 6) {

        const ejercicio =
            ejercicios[
                stretchPuntos
            ];


        document.getElementById(
            "exerciseIcon"
        ).innerText =
            ejercicio[0];


        document.getElementById(
            "exerciseName"
        ).innerText =
            ejercicio[1];


        document.getElementById(
            "exerciseDescription"
        ).innerText =
            ejercicio[2];


    } else {

        document.getElementById(
            "exerciseIcon"
        ).innerText =
            "🏆";


        document.getElementById(
            "exerciseName"
        ).innerText =
            "¡Rutina completada!";


        document.getElementById(
            "exerciseDescription"
        ).innerText =
            "Excelente trabajo.";


        document.getElementById(
            "stretchMessage"
        ).innerText =
            "🔥 ¡COMPLETASTE TODO!";


        ganarJuego();
    }
}


/* =========================
   INICIO DE LA APP
========================= */

/*
   Muestra la próxima cita
   guardada en este dispositivo.
*/

actualizarRecordatorio();


/*
   Carga las estadísticas
   de FisioGames.
*/

actualizarEstadisticas();