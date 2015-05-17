define(['jquery', 'canvasi', 'templates', 'api/generate', 'api/counter', 'functions/mpp'], function ($, canvasi, templates, generate, counter, mpp) {
	var $stat = $('#stat'),
		$statBox = $('#stat-box'),
		$statGen = $('#stat-generate'),
		$statProgress = $('#stat-progress'),
		$statInner = $('#stat-inner');

	var $procInputs = $("#proc :input"),
		procValues = _.map($procInputs, function (el) { return el.value; });
	var $algoInputs = $("#algo :input"),
		algoValues = _.map($algoInputs, function (el) { return el.value; });

	function generateCSV(data) {
		return $.map(data, function (line) {
				return $.map(line, function (v) {
					v = ('' + v).replace(/"/g, '""');

					//if (v.search(/("|,|\n)/g) >= 0) {
					//	v = '"' + v + '"';
					//}

					v = '"=""' + v + '"""';

					return v;
				}).join(',');
			}).join('\n');
	}

	function setInputChecked($inputs, value) {
		$inputs
			.removeAttr('checked')
			.filter('[value=' + value + ']')
			.attr('checked', 'true');
	}

	$stat
		.on('click', function () {
			$statBox.toggleClass('visible');
		});

	function iterate() {
		if (!$statBox.hasClass('visible')) {
			return;
		}

		var PROC_COUNT = canvasi.systemGraph.getElements().length;

		$statGen.attr('disabled', 'true');

		var TASKS_MIN = parseInt($("#stat-tasks-min").val(), 10),
			TASKS_MAX = parseInt($("#stat-tasks-max").val(), 10),
			TASKS_STEP = parseInt($("#stat-tasks-step").val(), 10);

		var TASKS_RANGE = _.range(TASKS_MIN, TASKS_MAX, TASKS_STEP);

		var CONN_MIN = parseFloat($("#stat-conn-min").val()),
			CONN_MAX = parseFloat($("#stat-conn-max").val()),
			CONN_STEP = parseFloat($("#stat-conn-step").val());

		var CONN_RANGE = _.range(CONN_MIN, CONN_MAX, CONN_STEP);

		var WEIGHT_MIN = parseInt($("#stat-weight-min").val(), 10),
			WEIGHT_MAX = parseInt($("#stat-weight-max").val(), 10);

		var TIMES = parseInt($('#stat-n').val(), 10);

		var TABLE = [],
			ROWS = [];

		function step(algo, proc, TASK_N, CONN_N) {
			setInputChecked($procInputs, proc);
			setInputChecked($algoInputs, algo);

			var E_Ky = 0,
				E_Ke = 0,
				E_Kae = 0;

			_.range(TIMES)
				.forEach(function () {
					generate.generateGraph(
						WEIGHT_MIN,
						WEIGHT_MAX,
						TASK_N,
						CONN_N,
						1);

					var counts = counter();
					var results = mpp();

					var Ky = results.states.length / counts.Tmin,
						Ke = Ky / PROC_COUNT,
						Kae = Ky / counts.Tkrgrk;

					E_Ky += Ky;
					E_Ke += Ke;
					E_Kae += Kae;
				});

			TABLE.push([algo, proc, TASK_N, CONN_N, E_Ky / TIMES, E_Ke / TIMES, E_Kae / TIMES]);
		}

		procValues.forEach(function (proc) {
			algoValues.forEach(function (algo) {
				TASKS_RANGE.forEach(function (TASK_N) {
					CONN_RANGE.forEach(function (CONN_N) {
						ROWS.push([proc, algo, TASK_N, CONN_N]);
					});
				});
			});
		});

		$statProgress.attr('max', ROWS.length);

		function curses(i) {
			$statProgress.attr('value', i);

			step.apply(this, ROWS[i]);

			if (++i >= ROWS.length) {
				$statInner.html(templates.stat({
					table: TABLE,
					csv: btoa(generateCSV(TABLE))
				}));

				$statGen.removeAttr('disabled');

				return;
			}

			setTimeout(curses.bind(this, i), 0);
		}

		curses(0);
	}

	$statGen.on('click', iterate);
});