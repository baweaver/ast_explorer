Rails.application.routes.draw do
  root 'static#index'

  post '/ast', to: 'ast#run'
end
