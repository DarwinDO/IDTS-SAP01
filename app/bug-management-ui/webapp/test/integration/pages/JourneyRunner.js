sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"idts/bugmanagementui/test/integration/pages/BugsList",
	"idts/bugmanagementui/test/integration/pages/BugsObjectPage"
], function (JourneyRunner, BugsList, BugsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('idts/bugmanagementui') + '/test/flp.html#app-preview',
        pages: {
			onTheBugsList: BugsList,
			onTheBugsObjectPage: BugsObjectPage
        },
        async: true
    });

    return runner;
});

