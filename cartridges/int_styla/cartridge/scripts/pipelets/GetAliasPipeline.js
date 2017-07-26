/**
* If the current URL is part of a magazine, then read the pipeline name from the corresponding magazine configuration.
* 
* @input  RedirectOrigin : String    		Original URL before redirect.
* @output PipelineName : String		 		Pipeline to redirect to. Null if no matching magazine configuration was found for the current request path.
*
*/

function execute(args : PipelineDictionary) : Number
{
	var Logger = require('dw/system/Logger').getLogger('styla', 'GetAliasPipeline');
	var StylaMain = require('/int_styla/cartridge/scripts/StylaMain');
	var magazineConfig,
		parts;
	
	args.PipelineName = null;

	magazineConfig = StylaMain.GetConfigForAlias(args.RedirectOrigin);
	
	if (magazineConfig) {
		// read pipeline name from configuration
		parts = magazineConfig.pipeline.split('-');
		if (parts.length === 2) {
			args.PipelineName = magazineConfig.pipeline;
		}
		else if (parts.length === 3) {
			// strip leading cartridge name
			args.PipelineName = parts[1] + '-' + parts[2];
		}
		else {
			args.PipelineName = null;
			var pip = magazineConfig.pipeline;
			if (typeof magazineConfig.pipeline === 'undefined') {
				pip = '(undefined)';
			}
			else if (magazineConfig.pipeline === null) {
				pip = '(null)';
			}
			Logger.error('invalid pipeline specified: "{0}"', pip);
		}
		
		if (args.PipelineName) {
			request.custom.MagazineConfiguration = magazineConfig;
		}
	}
	else {
		Logger.debug('no matching config found for path: ' + args.RedirectOrigin);
	}
		
	return PIPELET_NEXT;
}
