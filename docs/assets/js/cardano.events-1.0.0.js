
$(function()
{
  
	if (window.location.protocol == 'http:')
	{
		window.location.href = window.location.href.replace('http', 'https')
	}
	else
	{	
        $('.smoothscroll').on('click', function (e) {
            var target = this.hash,
            $target    = $(target);
            
                e.preventDefault();
                e.stopPropagation();

            $('html, body').stop().animate({
                'scrollTop': $target.offset().top
            }, 800, 'swing').promise().done(function () {

                window.location.hash = target;
            });
        });

        window.app =
        {
            controller: entityos._util.controller.code,
            vq: entityos._util.view.queue,
            get: entityos._util.data.get,
            set: entityos._util.data.set,
            invoke: entityos._util.controller.invoke,
            add: entityos._util.controller.add,
            show: entityos._util.view.queue.show
        };

        entityos._util.controller.invoke('cardano-events-init');
    }
});

entityos._util.controller.add(
{
    name: 'cardano-events-init',
    code: function ()
    {
		let urlData = 'https://raw.githubusercontent.com/selfdriven-octo/cardano-events/main/data/cardano-events.json'
		
		if (window.location.pathname == '/next')
		{
			urlData = 'https://raw.githubusercontent.com/selfdriven-octo/cardano-events/main/data/cardano-events-next.jso'
		}

        $.ajax(
        {
            type: 'GET',
            url: urlData,
            cors: false,
            cache: false,
            dataType: 'json',
            success: function(data)
            {
				app.set(
				{
					scope: 'cardano-events',
					context: 'all',
					value: data.cardano.events.data
				});

				const uriHash = window.location.hash

				if (uriHash != '')
				{
					const uriContextData = _.replace(uriHash, '#', '');

					if (uriContextData != '')
					{
						if (_.includes(uriContextData, 'experience:'))
						{
							let searchExperience = _.replace(uriContextData, 'experience:', '');
							searchExperience = _.replace(searchExperience, '-', ' ');
							app.set({scope: 'cardano-events', context: 'experience', value: searchExperience});
						}
						
						if (_.includes(uriContextData, 'search-text:'))
						{
							let searchText = _.replace(uriContextData, 'search-text:', '');
							$('#cardano-events-search-text').val(searchText);
							app.set({scope: 'cardano-events', context: 'search-text', value: searchText});
						}
					}
				}
				
				app.invoke('cardano-events-search');
			},
            error: function (data) {}
		});
	}
});

entityos._util.controller.add(
{
    name: 'cardano-events-search',
    code: function ()
    {
		const events = app.get(
		{
			scope: 'cardano-events',
			valueDefault: {}
		});

		if (events.all != undefined)
		{
			let eventsSearched = events.all;

			if (events['search-text'] != '' && events['search-text'] != undefined)
			{
				var searchText = events['search-text'].toLowerCase();

				_.each(eventsSearched, function (event)
				{
					event._descriptionSearch = _.join(_.map(event.description, function (description) {return description}), '');
				});

				eventsSearched = _.filter(eventsSearched, function (event)
				{
					return  (_.includes(event.name.toLowerCase(), searchText)
								|| _.includes(event._descriptionSearch.toLowerCase(), searchText)
							)
				});
			}

			if (events['search-testing'] != '1')
			{
				eventsSearched = _.filter(eventsSearched, function (event)
				{
					event._testing = _.includes(event.statuses, 'testing');
					return !event._testing
				});
			}


			if (events['search-experience-keep-it-simple'] == '1')
			{
				eventsSearched = _.filter(eventsSearched, function (event)
				{
					event._experience = _.includes(event['user-experiences'], 'keep-it-simple');
					return event._experience
				});
			}

			if (events['search-experience-dgov'] == '1')
			{
				eventsSearched = _.filter(eventsSearched, function (event)
				{
					event._experience = _.includes(event['user-experiences'], 'dgov');
					return event._experience
				});
			}

			let eventsView = app.vq.init({queue: 'events-view'});

			eventsView.add('<div class="row">');			
			_.each(eventsSearched, function (event)
			{
				event._availableStyle = (event._available?' border-left-width: 8px !important;':'');
				event._availableClass = (event._available?' border-left border-success':'');

				event._description = _.join(_.map(event.description, function (description)
				{
					return '<div class="mt-1 text-secondary">' + description + '</div>'
				}), '');

				if (_.has(event, 'images.icon'))
				{
					if (_.includes(event.images.icon, '.svg'))
					{
						event._imageHTML = _.join(
						[
							'<div class="col-auto" style="text-align:right; text-align:right;padding-right: 0px; padding-top:2px; padding-left: 28px;">',
								'<a class="" href="', event.url, '" target="_blank">',
									'<img src="/images/svg/', event.images.icon, '" class="img-fluid rounded" style="width:40px;">',
								'</a>',
							'</div>'
						],'');
					}
				}

				eventsView.add(
				[
					'<div class="col-12 col-md-6 col-xl-4 py-4">',
						'<div class="card shadow-lg', event._availableClass, '" style="height:100%;', event._availableStyle, '">',
							'<div class="card-body p-4 text-left">',
								'<div class="row">',
									event._imageHTML,
									'<div class="col">',
										'<h2 class="fw-bold mb-2" style="color: #e8d5cf;">',
											'<a class="" href="', event.url, '" target="_blank">', event.name, '</a>',
										'</h2>',
										'<div id="cardano-event-', event.name, '">',
											event._description,
										'</div>',
									'</div>',
								'</div>',
							'</div>',
						'</div>',
					'</div>'
				]);
			});

			eventsView.add('</div>');

			eventsView.render('#events-view');
		}
       
    }
});

entityos._util.controller.add(
{
    name: 'cardano-events-news',
    code: function ()
    {
        $.ajax(
        {
            type: 'GET',
            url: 'https://raw.githubusercontent.com/selfdriven-octo/cardano-events/main/data/cardano-events-news.json',
            cors: false,
            cache: false,
            dataType: 'json',
            success: function(data)
            {
                var eventsNewsView = app.vq.init({queue: 'events-news-view'});
                var eventNews = data.cardano.events.news.data;

                if (eventNews != undefined)
                {
                    eventsNewsView.add('<ul>');

                    _.each(eventNews, function (_eventNews)
                    {
                        eventsNewsView.add(
                        [
                           '<li class="mt-2">',
                                '<div ><a class="fw-bold"target="_blank" href="',  _eventNews.url, '">', _eventNews.description, ' <i class="fe fe-external-link"></i></a></div>',
                                '<div class="small text-secondary">', _eventNews.date, ' | ', _eventNews.by,'</div>',
                            '</li>'
                        ]);
                    });

                    eventsNewsView.add('</ul>');

                    eventsNewsView.render('#event-news-view');
                }
            },
            error: function (data) {}			
        });
    }
});